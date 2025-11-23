// app/api/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { z } from "zod";

export const runtime = "nodejs";       // ensure Node runtime (cheerio needs this)
export const dynamic = "force-dynamic";
export const maxDuration = 60;         // Vercel serverless limit

// Validate incoming body
const bodySchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
  label: z.string().max(255).optional(),
  config: z.record(z.any()).optional(),
});

// Helper: fetch with timeout
async function fetchWithTimeout(url: string, ms = 15_000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // ⚠️ Customize this and respect robots.txt / ToS
        "user-agent":
          "SuperScraperBot/1.0 (+https://your-domain.com/bot-info)",
        "accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function extractCharset(contentType: string | undefined): string | undefined {
  if (!contentType) return undefined;
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { urls, label, config } = parsed.data;

    // 🔁 Deduplicate URLs (keeps order)
    const uniqueUrls = Array.from(new Set(urls));
    const startedAt = new Date();

    // Create ScrapeJob (schema: ScrapeJob)
    const job = await prisma.scrapeJob.create({
      data: {
        label: label ?? `API job @ ${startedAt.toISOString()}`,
        status: "RUNNING",
        strategy: "http-basic",
        seeds: uniqueUrls,          // Json column, accepts array
        config: config ?? {},
        stats: {},
        lastRunAt: startedAt,
      },
      select: { id: true },         // optimize: only need id
    });

    // Pre-create ScrapeTarget rows for each URL
    const targets = await prisma.$transaction(
      uniqueUrls.map((url, index) =>
        prisma.scrapeTarget.create({
          data: {
            jobId: job.id,
            url,
            normalizedUrl: url, // put canonicalization here if needed
            depth: 0,
            metadata: { index },
          },
          select: { id: true, url: true },
        })
      )
    );

    const targetByUrl = new Map(targets.map((t) => [t.url, t]));
    const limit = pLimit(5); // concurrency limit (tune depending on your plan)

    type ResultEntry = {
      url: string;
      ok: boolean;
      statusCode?: number;
      error?: string;
    };

    const results: ResultEntry[] = await Promise.all(
      uniqueUrls.map((url) =>
        limit(async (): Promise<ResultEntry> => {
          const started = Date.now();
          let statusCode: number | undefined;
          let bytes: number | undefined;

          const target = targetByUrl.get(url);
          if (!target) {
            // Should not happen, but guard for safety
            return {
              url,
              ok: false,
              error: "No target found for URL",
            };
          }

          try {
            const res = await fetchWithTimeout(url);
            statusCode = res.status;

            const contentType = res.headers.get("content-type") ?? undefined;
            const charset = extractCharset(contentType);
            const body = await res.text();
            bytes = body.length;

            const durationMs = Date.now() - started;

            // Create ScrapeRequest (schema: ScrapeRequest)
            const request = await prisma.scrapeRequest.create({
              data: {
                jobId: job.id,
                targetId: target.id,
                url,
                method: "GET",
                statusCode: res.status,
                durationMs,
                bytes,
                requestHeaders: {}, // populate if you start customizing input headers
                responseHeaders: Object.fromEntries(res.headers.entries()),
                timings: { durationMs },
              },
              select: { id: true },
            });

            // Parse HTML with cheerio
            const $ = cheerio.load(body);

            const title =
              $("head title").first().text().trim() ||
              $('meta[property="og:title"]').attr("content") ||
              null;

            const description =
              $('meta[name="description"]').attr("content") ||
              $('meta[property="og:description"]').attr("content") ||
              null;

            const og = {
              title: $('meta[property="og:title"]').attr("content") || null,
              description:
                $('meta[property="og:description"]').attr("content") || null,
              image: $('meta[property="og:image"]').attr("content") || null,
              url: $('meta[property="og:url"]').attr("content") || null,
              type: $('meta[property="og:type"]').attr("content") || null,
            };

            const headings = ["h1", "h2", "h3"].map((tag) => ({
              tag,
              values: $(tag)
                .map((_, el) => $(el).text().trim())
                .get()
                .filter(Boolean),
            }));

            const links = $("a[href]")
              .map((_, el) => {
                const href = $(el).attr("href") || "";
                const text = $(el).text().trim();
                return { href, text };
              })
              .get();

            const images = $("img[src]")
              .map((_, el) => {
                const src = $(el).attr("src") || "";
                const alt = $(el).attr("alt") || "";
                return { src, alt };
              })
              .get();

            // Normalize / truncate text to avoid giant rows
            const textContent = $("body").text().replace(/\s+/g, " ").trim();
            const truncatedHtml =
              body.length > 1_000_000 ? body.slice(0, 1_000_000) : body;
            const truncatedText =
              textContent.length > 1_000_000
                ? textContent.slice(0, 1_000_000)
                : textContent;

            // Simple hash (note: hash is unique column in ScrapeResult)
            const hash = `${res.status}-${bytes ?? 0}-${Buffer.from(
              truncatedText.slice(0, 256)
            ).toString("base64")}`;

            // Create ScrapeResult (schema: ScrapeResult)
            await prisma.scrapeResult.create({
              data: {
                jobId: job.id,
                targetId: target.id,
                url,
                contentType,
                charset,
                rawHtml: truncatedHtml,
                rawText: truncatedText,
                structured: {
                  title,
                  description,
                  og,
                  headings,
                  links,
                  images,
                },
                metadata: {
                  status: res.status,
                  finalUrl: (res as any).url ?? url,
                  requestId: request.id,
                },
                hash,
              },
            });

            // Update ScrapeTarget (status + lastScrapedAt)
            await prisma.scrapeTarget.update({
              where: { id: target.id },
              data: {
                lastStatus: res.status,
                lastScrapedAt: new Date(),
              },
            });

            return {
              url,
              ok: true,
              statusCode: res.status,
            };
          } catch (error: any) {
            const durationMs = Date.now() - started;
            const message = error?.message ?? "Unknown scrape error";
            const code = (error as any)?.code ?? "UNKNOWN";

            // Save failed ScrapeRequest
            const request = await prisma.scrapeRequest.create({
              data: {
                jobId: job.id,
                targetId: target.id,
                url,
                method: "GET",
                durationMs,
                error: message,
                errorKind: "NETWORK",
              },
              select: { id: true },
            });

            // Save ScrapeError (schema: ScrapeError)
            await prisma.scrapeError.create({
              data: {
                jobId: job.id,
                targetId: target.id,
                requestId: request.id,
                code,
                message,
                details: {
                  url,
                  durationMs,
                  stack: error?.stack ?? null,
                },
              },
            });

            return {
              url,
              ok: false,
              statusCode,
              error: message,
            };
          }
        })
      )
    );

    const successCount = results.filter((r) => r.ok).length;
    const failureCount = results.length - successCount;
    const finishedAt = new Date();

    // Job status in DB (enum ScrapeJobStatus)
    const finalJobStatus =
      successCount === results.length ? "COMPLETED" : "FAILED";

    // Update ScrapeJob stats
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: finalJobStatus,
        lastRunAt: startedAt,
        completedAt: finishedAt,
        stats: {
          totalUrlsRequested: urls.length,
          totalUrlsUnique: results.length,
          success: successCount,
          failed: failureCount,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
        },
      },
    });

    // API-level status: allow "PARTIAL" for client visibility
    const apiStatus =
      failureCount === 0 ? "OK" : successCount === 0 ? "FAILED" : "PARTIAL";

    return NextResponse.json(
      {
        jobId: job.id,
        status: apiStatus,
        results,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("SCRAPE_API_ERROR", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: err?.message ?? "Unknown",
      },
      { status: 500 }
    );
  }
}
