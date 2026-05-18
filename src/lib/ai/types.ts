export type AIProviderName = "grok" | "claude";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  usage: TokenUsage;
}

export interface ImageResult {
  url: string;
  model: string;
  /** הערכה — לפי מחירון קבוע */
  costUsd: number;
}

export interface AIProvider {
  readonly name: AIProviderName;
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;
  generateImage?(options: ImageGenerationOptions): Promise<ImageResult>;
}
