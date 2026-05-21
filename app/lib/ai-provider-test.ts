import {
  getAnthropicProviderConfig,
  getOpenAIProviderConfig,
  type AiProviderName,
} from "./ai-provider-config";

export type ProviderConnectivityResult = {
  provider: AiProviderName;
  configured: boolean;
  reachable: boolean;
  model: string;
  message: string;
};

async function testOpenAIConnectivity(): Promise<ProviderConnectivityResult> {
  const config = getOpenAIProviderConfig();

  if (!config.configured) {
    return {
      provider: "openai",
      configured: false,
      reachable: false,
      model: config.model,
      message: "OPENAI_API_KEY is not configured on the server.",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        store: false,
        max_output_tokens: 16,
        input: "Reply with the single word ready.",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "openai",
        configured: true,
        reachable: false,
        model: config.model,
        message: `OpenAI request failed with ${response.status}. ${errorText.slice(0, 180)}`,
      };
    }

    return {
      provider: "openai",
      configured: true,
      reachable: true,
      model: config.model,
      message: "OpenAI server-side route is configured and reachable from this deployment.",
    };
  } catch (error) {
    return {
      provider: "openai",
      configured: true,
      reachable: false,
      model: config.model,
      message:
        error instanceof Error
          ? `OpenAI connectivity test failed: ${error.message}`
          : "OpenAI connectivity test failed.",
    };
  }
}

async function testAnthropicConnectivity(): Promise<ProviderConnectivityResult> {
  const config = getAnthropicProviderConfig();

  if (!config.configured) {
    return {
      provider: "anthropic",
      configured: false,
      reachable: false,
      model: config.model,
      message: "ANTHROPIC_API_KEY is not configured on the server.",
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 16,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Reply with the single word ready.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        provider: "anthropic",
        configured: true,
        reachable: false,
        model: config.model,
        message: `Anthropic request failed with ${response.status}. ${errorText.slice(0, 180)}`,
      };
    }

    return {
      provider: "anthropic",
      configured: true,
      reachable: true,
      model: config.model,
      message: "Anthropic server-side route is configured and reachable from this deployment.",
    };
  } catch (error) {
    return {
      provider: "anthropic",
      configured: true,
      reachable: false,
      model: config.model,
      message:
        error instanceof Error
          ? `Anthropic connectivity test failed: ${error.message}`
          : "Anthropic connectivity test failed.",
    };
  }
}

export async function testProviderConnectivity(provider: AiProviderName) {
  return provider === "openai"
    ? testOpenAIConnectivity()
    : testAnthropicConnectivity();
}

export async function testAllProviderConnectivity() {
  return Promise.all([
    testOpenAIConnectivity(),
    testAnthropicConnectivity(),
  ]);
}
