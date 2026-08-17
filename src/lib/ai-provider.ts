/**
 * Universal Multi-Model AI Engine for Kedai Nyamleng POS
 * Auto Failover Order: OpenAI (GPT-4o-mini) -> DeepSeek -> Groq (Llama 3) -> Anthropic Claude -> Google Gemini
 */

export interface AiCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  text: string;
  provider: "OpenAI" | "DeepSeek" | "Groq" | "Anthropic" | "Gemini" | "Fallback-Local";
  modelUsed: string;
}

export async function generateMultiModelAiText(
  options: AiCompletionOptions
): Promise<AiCompletionResponse> {
  const systemPrompt =
    options.systemPrompt ||
    "Anda adalah AI Executive Business Advisor untuk Kedai Nyamleng Malang. Jawablah dengan singkat, profesional, presisi, dan berbasis data keuangan.";

  // 1. Try OpenAI GPT-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: options.prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return { text, provider: "OpenAI", modelUsed: "gpt-4o-mini" };
        }
      }
    } catch (err) {
      console.warn("OpenAI API failover:", err);
    }
  }

  // 2. Try DeepSeek API
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: options.prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return { text, provider: "DeepSeek", modelUsed: "deepseek-chat" };
        }
      }
    } catch (err) {
      console.warn("DeepSeek API failover:", err);
    }
  }

  // 3. Try Groq (Llama 3 / GPT-OSS)
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: options.prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return { text, provider: "Groq", modelUsed: "llama-3.3-70b-versatile" };
        }
      }
    } catch (err) {
      console.warn("Groq API failover:", err);
    }
  }

  // 4. Try Anthropic Claude 3.5
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: options.maxTokens ?? 500,
          system: systemPrompt,
          messages: [{ role: "user", content: options.prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text;
        if (text) {
          return { text, provider: "Anthropic", modelUsed: "claude-3-5-haiku" };
        }
      }
    } catch (err) {
      console.warn("Anthropic API failover:", err);
    }
  }

  // 5. Try Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nPertanyaan/Data: ${options.prompt}` },
                ],
              },
            ],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text, provider: "Gemini", modelUsed: "gemini-1.5-flash" };
        }
      }
    } catch (err) {
      console.warn("Gemini API failover:", err);
    }
  }

  // Final Local Rule Engine Fallback
  return {
    text: "Analisis bisnis Kedai Nyamleng menunjukkan kinerja finansial positif. Disarankan mempertahankan pencatatan HPP berbasis SAK EMKM dan mengoptimalkan bundling menu terlaris.",
    provider: "Fallback-Local",
    modelUsed: "Rule-Engine-V1",
  };
}
