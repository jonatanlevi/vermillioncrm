import { getAIProvider } from "./index";
import { logImageStep, logLlmStep } from "./audit";
import { getAgentRunContext } from "./run-context";
import type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  ImageGenerationOptions,
} from "./types";

export async function completeTracked(
  messages: ChatMessage[],
  options: CompletionOptions | undefined,
  meta: { title: string; rationale: string }
): Promise<string> {
  const ai = getAIProvider();
  const result = await ai.complete(messages, options);
  const ctx = getAgentRunContext();
  if (ctx) {
    await logLlmStep(ctx.runId, { ...meta, inputPreview: messages.at(-1)?.content }, ai.name, result);
  }
  return result.text;
}

export async function completeRaw(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<CompletionResult> {
  return getAIProvider().complete(messages, options);
}

export async function generateImageTracked(
  options: ImageGenerationOptions,
  meta: { title: string; rationale: string }
): Promise<{ url: string }> {
  const ai = getAIProvider();
  if (!ai.generateImage) throw new Error("הספק הנוכחי לא תומך ביצירת תמונות");
  const result = await ai.generateImage(options);
  const ctx = getAgentRunContext();
  if (ctx) {
    await logImageStep(ctx.runId, { ...meta, prompt: options.prompt }, ai.name, result);
  }
  return { url: result.url };
}
