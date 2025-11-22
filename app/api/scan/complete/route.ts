import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// ✅ VERIFY ACCESS (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event");

  if (!eventId) {
    return NextResponse.json({ error: "Missing event parameter" }, { status: 400 });
  }

  // Check if event exists
  const event = await prisma.scanEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// ✅ COMPLETE SCAN (POST)
export async function POST(req: Request) {
  try {
    const { scanEventId, secondData } = await req.json();

    const entries = Object.entries(secondData).map(([key, value]) => ({
      scanEventId,
      key,
      value,
    }));

    await prisma.scanEventData.createMany({
      data: entries,
    });

    await prisma.scanEvent.update({
      where: { id: scanEventId },
      data: {
        redirectUrl: "/watch?event=" + scanEventId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SCAN_COMPLETE_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
