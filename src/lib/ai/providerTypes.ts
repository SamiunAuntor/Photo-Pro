export type AIProvider = "mock" | "gemini";

export type ProviderProcessResult = {
  processedImage: string;
  provider: AIProvider;
  warning: string | null;
};
