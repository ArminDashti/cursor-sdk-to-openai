<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { fetchLog, type LogDetail } from "@/lib/api";

const route = useRoute();
const log = ref<LogDetail | null>(null);
const error = ref("");

onMounted(async () => {
  try {
    log.value = await fetchLog(String(route.params.id));
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load log";
  }
});

function parseJson(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function messageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return JSON.stringify(part);
      })
      .join("\n");
  }
  if (content == null) return "";
  return JSON.stringify(content);
}

function extractPrompt(requestBody: unknown): string {
  const body = parseJson(requestBody);
  if (body == null) return "—";
  if (typeof body === "string") return body;

  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;

    if (Array.isArray(obj.messages)) {
      return (obj.messages as Array<{ role?: string; content?: unknown }>)
        .map((msg) => `${msg.role ?? "unknown"}: ${messageContent(msg.content)}`)
        .join("\n\n");
    }

    if ("input" in obj) {
      const input = obj.input;
      if (typeof input === "string") return input;
      if (Array.isArray(input)) {
        return input
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "content" in item) {
              return messageContent((item as { content?: unknown }).content);
            }
            return JSON.stringify(item);
          })
          .join("\n\n");
      }
      return JSON.stringify(input, null, 2);
    }

    if (typeof obj.prompt === "string") return obj.prompt;
  }

  return JSON.stringify(body, null, 2);
}

function extractResponse(responseBody: unknown): string {
  const body = parseJson(responseBody);
  if (body == null) return "—";
  if (typeof body === "string") return body;

  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;

    if (typeof obj.content === "string") return obj.content;

    if (Array.isArray(obj.choices) && obj.choices.length > 0) {
      const choice = obj.choices[0] as { message?: { content?: unknown }; text?: string };
      if (choice.message?.content != null) return messageContent(choice.message.content);
      if (typeof choice.text === "string") return choice.text;
    }

    if (Array.isArray(obj.output_text)) {
      return (obj.output_text as unknown[]).map(String).join("\n");
    }
    if (typeof obj.output_text === "string") return obj.output_text;

    if (Array.isArray(obj.output)) {
      const texts: string[] = [];
      for (const item of obj.output as Array<{ content?: unknown }>) {
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item.content)) {
          for (const part of item.content as Array<{ text?: string }>) {
            if (part?.text) texts.push(part.text);
          }
        }
      }
      if (texts.length) return texts.join("\n\n");
      return JSON.stringify(obj.output, null, 2);
    }
  }

  return JSON.stringify(body, null, 2);
}

const promptText = computed(() => (log.value ? extractPrompt(log.value.request_body) : ""));
const responseText = computed(() => (log.value ? extractResponse(log.value.response_body) : ""));
</script>

<template>
  <div>
    <RouterLink class="text-sm text-link hover:underline" to="/logs">← Back to Requests</RouterLink>
    <h1 class="mt-3 text-2xl font-semibold">Request detail</h1>
    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error }}</p>

    <template v-else-if="log">
      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt class="text-muted-foreground">Method / Path</dt>
          <dd class="font-medium">{{ log.method }} {{ log.path }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Model</dt>
          <dd class="font-medium">{{ log.model ?? "—" }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Status</dt>
          <dd class="font-medium">{{ log.status_code }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Duration</dt>
          <dd class="font-medium">{{ log.duration_ms }} ms</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Time</dt>
          <dd class="font-medium">{{ log.created_at }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Cursor agent</dt>
          <dd class="font-medium break-all">{{ log.cursor_agent_id ?? "—" }}</dd>
        </div>
      </dl>

      <p
        v-if="log.error_message"
        class="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        {{ log.error_message }}
      </p>

      <section class="mt-6">
        <h2 class="text-lg font-semibold">Prompt</h2>
        <p class="mt-1 text-sm text-muted-foreground">What was sent to Cursor</p>
        <pre
          class="mt-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-4 text-sm"
        >{{ promptText }}</pre>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold">Response</h2>
        <p class="mt-1 text-sm text-muted-foreground">What Cursor returned</p>
        <pre
          class="mt-2 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-4 text-sm"
        >{{ responseText }}</pre>
      </section>
    </template>
  </div>
</template>
