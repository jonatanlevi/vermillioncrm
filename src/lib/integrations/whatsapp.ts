/** WhatsApp integration — stub now, plug Twilio/Meta Cloud API later */

export interface WhatsappSendParams {
  phone: string;
  body: string;
}

export async function sendWhatsapp(params: WhatsappSendParams): Promise<{ ok: boolean; id?: string }> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "stub";

  if (provider === "stub") {
    console.info("[WhatsApp stub]", params.phone, params.body.slice(0, 80));
    return { ok: true, id: `stub-${Date.now()}` };
  }

  // TODO: Twilio / Meta WhatsApp Business API
  throw new Error(`WhatsApp provider "${provider}" not implemented yet`);
}
