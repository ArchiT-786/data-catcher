import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { fullName, email, phone, address, about, dream, imageBase64 } = body;

        if (!fullName || !email || !phone || !about || !dream) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // --- AI GENERATION ---
        const prompt = `
You are an expert motivational mentor.
Analyze the user's details below and produce:

1. A motivation score from 1 to 10
2. A title (like "The Relentless Builder")
3. A warm, emotional, powerful motivation paragraph (150-200 words)

User details:
Name: ${fullName}
About them: ${about}
Dream: ${dream}
Their vibe from photo (if any): ${imageBase64 ? "Photo uploaded" : "No photo"}
`;

        const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const raw = ai.choices[0].message.content ?? "";

        // Extract fields
        const scoreMatch = raw.match(/score[:\- ]+(\d+)/i);
        const titleMatch = raw.match(/title[:\- ](.+)/i);
        const messageMatch = raw.split("\n").slice(1).join("\n");

        const score = scoreMatch ? parseInt(scoreMatch[1]) : 8;
        const title = titleMatch ? titleMatch[1].trim() : "Your Potential is Rising";
        const message = messageMatch.trim();

        // --- SAVE IN DATABASE ---
        const entry = await prisma.motivationEntry.create({
            data: {
                fullName,
                email,
                phone,
                address,
                about,
                dream,
                imageBase64: imageBase64 || null,
                score,
                title,
                message,
                meta: {},
            },
        });

        return NextResponse.json(
            {
                id: entry.id,
                score,
                title,
                message,
            },
            { status: 200 },
        );
    } catch (err: any) {
        console.error("MOTIVATION_API_ERROR", err);
        return NextResponse.json(
            { error: "Server error", details: err.message },
            { status: 500 },
        );
    }
}
