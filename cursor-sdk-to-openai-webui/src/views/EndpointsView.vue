<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchEndpoints, type EndpointItem } from "@/lib/api";

const endpoints = ref<EndpointItem[]>([]);
const error = ref("");

onMounted(async () => {
  try {
    const data = await fetchEndpoints();
    endpoints.value = data.endpoints;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load endpoints";
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">OpenAI-compatible endpoints</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Reference for clients using this proxy. This page does not send chat requests.
    </p>
    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <div v-else class="mt-6 space-y-4">
      <article v-for="(ep, i) in endpoints" :key="i" class="rounded-lg border p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded bg-muted px-2 py-1 text-xs font-medium">{{ ep.method }}</span>
          <code class="text-sm">{{ ep.path }}</code>
        </div>
        <p class="mt-2 text-sm text-muted-foreground">{{ ep.description }}</p>
        <pre class="mt-3 overflow-x-auto rounded bg-muted/30 p-3 text-xs">{{ ep.example }}</pre>
      </article>
    </div>
  </div>
</template>
