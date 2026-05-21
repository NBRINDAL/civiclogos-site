export type AiProviderName = "openai" | "anthropic";

export type OpenAIProviderConfig = {
  provider: "openai";
  configured: boolean;
  model: string;
  apiKeyPresent: boolean;
};

export type AnthropicProviderConfig = {
  provider: "anthropic";
  configured: boolean;
  model: string;
  apiKeyPresent: boolean;
};

export type AiProviderConfig = OpenAIProviderConfig | AnthropicProviderConfig;

export function getOpenAIProviderConfig(): OpenAIProviderConfig {
  const apiKeyPresent = Boolean(process.env.OPENAI_API_KEY?.trim());

  return {
    provider: "openai",
    configured: apiKeyPresent,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    apiKeyPresent,
  };
}

export function getAnthropicProviderConfig(): AnthropicProviderConfig {
  const apiKeyPresent = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  return {
    provider: "anthropic",
    configured: apiKeyPresent,
    model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514",
    apiKeyPresent,
  };
}

export function getAiProviderConfigs(): AiProviderConfig[] {
  return [getOpenAIProviderConfig(), getAnthropicProviderConfig()];
}

export function isAiProviderConfigured(provider: AiProviderName) {
  return provider === "openai"
    ? getOpenAIProviderConfig().configured
    : getAnthropicProviderConfig().configured;
}

export function hasAnyAiProviderConfigured() {
  return getAiProviderConfigs().some((provider) => provider.configured);
}
