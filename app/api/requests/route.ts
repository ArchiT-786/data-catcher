import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, RequestType } from "@prisma/client";
import { uploadImage } from "@/lib/upload";
import { dispatchMiniMax } from "@/lib/minimax";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

function isPromptUnsafe(prompt?: string | null) {
  if (!prompt) return false;
  const lower = prompt.toLowerCase();
  const bannedKeywords = [
    "porn",
    "sexual",
    "nudity",
    "child",
    "gore",
    "murder",
    "rape",
    "hate",
  ];
  return bannedKeywords.some((k) => lower.includes(k));
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const type = form.get("type") as string;
    const name = (form.get("name") as string) || null;
    const email = form.get("email") as string;
    const phone = (form.get("phone") as string) || null;
    const prompt = (form.get("prompt") as string) || null;
    const style = (form.get("style") as string) || null;
    const acceptedTerms = form.get("acceptedTerms") === "true";

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "Terms and conditions must be accepted." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // validate enum
    if (!type || !(type in RequestType)) {
      return NextResponse.json(
        { error: "Invalid request type." },
        { status: 400 }
      );
    }

    if (isPromptUnsafe(prompt)) {
      return NextResponse.json(
        {
          error:
            "Your prompt violates our content policy. Please avoid vulgar, explicit, or illegal content.",
        },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    const image = form.get("image") as File | null;

    if (image && image.size > 0) {
      imageUrl = await uploadImage(image);
    }

    // create request entry
    const userRequest = await prisma.userRequest.create({
      data: {
        type: type as RequestType,
        name,
        email,
        phone,
        prompt,
        style,
        imageUrl,
      },
    });

    // fire-and-forget job dispatch (NO AWAIT, NO DOUBLE CALL)
    dispatchMiniMax(userRequest).catch(async (err) => {
      console.error("MiniMax error", err);
      await prisma.userRequest.update({
        where: { id: userRequest.id },
        data: { status: "FAILED" },
      });
    });

    // Immediately return to client
    return NextResponse.json({
      success: true,
      id: userRequest.id,
      message: "Request received and processing has started.",
    });
  } catch (err) {
    console.error("REQUEST API ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
