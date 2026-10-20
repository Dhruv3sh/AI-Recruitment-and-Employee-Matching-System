const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "qwen3:8b";

export async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    return response.ok;
  } catch {
    return false;
  }
}

export async function generateWithQwen(prompt, options = {}) {
  const request = {
    model: OLLAMA_MODEL,

    messages: [
      {
        role: "user",
        content: prompt
      }
    ],

    stream: false,
    think: false,

    options: {
      temperature: options.temperature ?? 0.1
    }
  };

  if (options.format) {
    request.format = options.format;
  }

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  return data.message?.content || "";
}

export async function generateJSON(prompt, schema) {
  const jsonSchema = schema?.toJSONSchema();
  const enhancedPrompt = `
You are a recruitment analysis system.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations outside the JSON.

${jsonSchema ? `Use this JSON Schema exactly:\n${JSON.stringify(jsonSchema)}` : ""}

${prompt}
`;

  const text = await generateWithQwen(enhancedPrompt, {
    temperature: 0,
    format: jsonSchema || "json"
  });

  const result = parseJSON(text);

  return schema ? schema.parse(result) : result;
}

function parseJSON(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Qwen did not return valid JSON");
    }

    return JSON.parse(
      cleaned.slice(start, end + 1)
    );
  }
}
