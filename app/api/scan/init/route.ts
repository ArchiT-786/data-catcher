import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();

  // Create ScanEvent
  const scanEvent = await prisma.scanEvent.create({
    data: {
      barcodeId: `barcode_${Date.now()}`,
      redirectUrl: "https://instagram.com", // SET YOUR FINAL REDIRECT
    },
  });

  // Save all keys into ScanEventData
  const entries = Object.entries(body).map(([key, value]) => ({
    scanEventId: scanEvent.id,
    key,
    value,
  }));

  await prisma.scanEventData.createMany({
    data: entries,
  });

  return new Response(
    JSON.stringify({
      success: true,
      scanEventId: scanEvent.id,
    }),
    { status: 200 }
  );
}
