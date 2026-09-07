import { config } from "../config.js";

type ChatMessage = {
  role: string;
  content?: string | Array<{ type?: string; text?: string }>;
};

export function messagesToPrompt(messages: ChatMessage[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((p) => p.text ?? "").join("\n")
          : "";
    lines.push(`${msg.role}: ${content}`);
  }
  return lines.join("\n\n");
}

export function responsesInputToPrompt(input: unknown): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "content" in item) {
          const c = (item as { content?: unknown }).content;
          return typeof c === "string" ? c : JSON.stringify(c);
        }
        return JSON.stringify(item);
      })
      .join("\n\n");
  }
  if (input && typeof input === "object") return JSON.stringify(input);
  return String(input ?? "");
}

export type CursorRunResult = {
  text: string;
  agentId?: string;
};

type CursorAgent = Awaited<ReturnType<typeof createLocalCursorAgent>>;

export async function createLocalCursorAgent(model: string) {
  if (!config.cursorApiKey) {
    throw new Error("RAMIN_2_CURSOR_API (or CURSOR_API_KEY) is not configured");
  }

  const { Agent } = await import("@cursor/sdk");
  return Agent.create({
    apiKey: config.cursorApiKey,
    model: { id: model },
    local: { cwd: config.cursorCwd },
  });
}

export async function runCursorPrompt(options: {
  prompt: string;
  model: string;
  stream?: boolean;
  onDelta?: (text: string) => void;
  agent?: CursorAgent;
}): Promise<CursorRunResult> {
  const agent = options.agent ?? (await createLocalCursorAgent(options.model));
  const ownsAgent = !options.agent;

  try {
    const run = await agent.send(options.prompt);
    let text = "";

    if (options.stream && options.onDelta) {
      for await (const event of run.stream()) {
        if (event.type === "assistant") {
          for (const block of event.message.content) {
            if (block.type === "text" && block.text) {
              text += block.text;
              options.onDelta(block.text);
            }
          }
        }
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      throw new Error(result.error?.message ?? "Cursor agent failed");
    }

    if (!text && result.result) {
      text = result.result;
      if (options.stream && options.onDelta) options.onDelta(text);
    }

    return {
      text,
      agentId: agent.agentId,
    };
  } finally {
    if (ownsAgent) {
      await agent[Symbol.asyncDispose]();
    }
  }
}

const FALLBACK_MODELS = ["composer-2", "composer-2.5", "auto-smart"] as const;

function fallbackModelList(): Array<{ id: string; owned_by: string }> {
  const ids = [...FALLBACK_MODELS, config.defaultModel];
  return ids
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => ({ id, owned_by: "cursor" }));
}

export async function listCursorModels(): Promise<Array<{ id: string; owned_by: string }>> {
  if (!config.cursorApiKey) {
    return fallbackModelList();
  }

  try {
    const { Cursor } = await import("@cursor/sdk");
    const models = await Cursor.models.list({ apiKey: config.cursorApiKey });
    if (models.length) {
      return models.map((m) => ({ id: m.id, owned_by: "cursor" }));
    }
  } catch {
    /* Cursor account may lack listing (e.g. free / plan_required) — keep UI selectable. */
  }

  return fallbackModelList();
}

export function openAiChatResponse(options: {
  id: string;
  model: string;
  content: string;
  created?: number;
}) {
  const created = options.created ?? Math.floor(Date.now() / 1000);
  return {
    id: options.id,
    object: "chat.completion",
    created,
    model: options.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: options.content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

export function openAiResponsesResponse(options: {
  id: string;
  model: string;
  content: string;
}) {
  return {
    id: options.id,
    object: "response",
    created_at: Math.floor(Date.now() / 1000),
    status: "completed",
    model: options.model,
    output: [
      {
        type: "message",
        id: `msg_${options.id}`,
        role: "assistant",
        content: [{ type: "output_text", text: options.content }],
      },
    ],
  };
}

export function sseChatChunk(options: {
  id: string;
  model: string;
  delta: string;
  finish?: boolean;
}) {
  return {
    id: options.id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: options.model,
    choices: [
      {
        index: 0,
        delta: options.finish ? {} : { content: options.delta },
        finish_reason: options.finish ? "stop" : null,
      },
    ],
  };
}
