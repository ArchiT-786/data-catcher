import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { scanEventId, secondData } = await req.json();

  const entries = Object.entries(secondData).map(([key, value]) => ({
    scanEventId,
    key,
    value,
  }));

  // Save second dataset
  await prisma.scanEventData.createMany({
    data: entries,
  });

  // Mark Event completed
  await prisma.scanEvent.update({
    where: { id: scanEventId },
    data: {
      redirectUrl: "/watch?event=" + scanEventId,
    },
  });

  return new Response(JSON.stringify({ success: true }));
}
