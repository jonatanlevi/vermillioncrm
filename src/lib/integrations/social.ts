/** Social network publishing — stubs per network */

import type { SocialNetworkId } from "@/lib/social/networks";

export type SocialNetwork = SocialNetworkId;

export async function publishPost(params: {
  network: SocialNetwork;
  content: string;
  mediaUrl?: string;
}): Promise<{ ok: boolean; externalId?: string }> {
  console.info(`[Social stub] ${params.network}`, params.content.slice(0, 60));
  return { ok: true, externalId: `stub-${params.network}-${Date.now()}` };
}
