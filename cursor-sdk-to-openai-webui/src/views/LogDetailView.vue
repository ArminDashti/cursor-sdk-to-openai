<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { fetchLog } from "@/lib/api";

const route = useRoute();
const log = ref<Record<string, unknown> | null>(null);
const error = ref("");

onMounted(async () => {
  try {
    log.value = await fetchLog(String(route.params.id));
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load log";
  }
});

function pretty(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}
</script>

<template>
  <div>
    <RouterLink class="text-sm text-blue-700 hover:underline" to="/logs">← Back to logs</RouterLink>
    <h1 class="mt-3 text-2xl font-semibold">Log detail</h1>
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
    <pre v-else-if="log" class="mt-4 overflow-x-auto rounded-lg border bg-muted/20 p-4 text-xs">{{ pretty(log) }}</pre>
  </div>
</template>
