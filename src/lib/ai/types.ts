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

export interface AIProvider {
  readonly name: AIProviderName;
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>;
  generateImage?(options: ImageGenerationOptions): Promise<{ url: string }>;
}
