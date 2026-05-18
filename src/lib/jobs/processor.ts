import { db } from "@/lib/db";
import { getAgent } from "@/lib/agents";
import { publishPost } from "@/lib/integrations/social";

const MAX_JOBS_PER_TICK = 10;

export async function processJobQueue() {
  const jobs = await db.automationJob.findMany({
    where: { status: "QUEUED", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    take: MAX_JOBS_PER_TICK,
  });

  for (const job of jobs) {
    await db.automationJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", attempts: { increment: 1 } },
    });

    try {
      const payload = JSON.parse(job.payload) as Record<string, unknown>;
      const result = await handleJob(job.type, payload);
      await db.automationJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", result: JSON.stringify(result) },
      });
    } catch (e) {
      await db.automationJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 3 ? "FAILED" : "QUEUED",
          result: JSON.stringify({ error: String(e) }),
        },
      });
    }
  }
}

async function handleJob(
  type: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (type) {
    case "media.generate": {
      const agent = getAgent("media");
      const result = await agent.run({
        agentId: "media",
        input: String(payload.prompt ?? "Create marketing visual"),
      });
      return { ...result };
    }

    case "campaign.attach_media": {
      return { attached: payload.mediaAssetId };
    }

    case "social.publish": {
      const ok = await publishPost({
        network: payload.network as "instagram",
        content: String(payload.content ?? ""),
        mediaUrl: payload.mediaUrl ? String(payload.mediaUrl) : undefined,
      });
      return { published: ok };
    }

    case "whatsapp.notify_owner": {
      return { notified: true, message: payload.message };
    }

    default:
      return { skipped: true, type };
  }
}
