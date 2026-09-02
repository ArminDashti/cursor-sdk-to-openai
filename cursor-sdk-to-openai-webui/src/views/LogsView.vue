<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { fetchLogs, type LogRow } from "@/lib/api";

const items = ref<LogRow[]>([]);
const total = ref(0);
const page = ref(1);
const retentionDays = ref(30);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await fetchLogs(page.value, 20);
    items.value = data.items;
    total.value = data.total;
    retentionDays.value = data.retention_days;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load logs";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Request logs</h1>
        <p class="text-sm text-muted-foreground">
          Showing recent requests. Logs older than {{ retentionDays }} days are purged automatically.
        </p>
      </div>
      <button class="rounded-md border px-3 py-2 text-sm" @click="load">Refresh</button>
    </div>

    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>

    <div v-else class="overflow-x-auto rounded-lg border">
      <table class="min-w-full text-sm">
        <thead class="bg-muted/50 text-left">
          <tr>
            <th class="px-3 py-2">Time</th>
            <th class="px-3 py-2">Method</th>
            <th class="px-3 py-2">Path</th>
            <th class="px-3 py-2">Status</th>
            <th class="px-3 py-2">Model</th>
            <th class="px-3 py-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="border-t hover:bg-muted/30">
            <td class="px-3 py-2 whitespace-nowrap">{{ row.created_at }}</td>
            <td class="px-3 py-2">{{ row.method }}</td>
            <td class="px-3 py-2">
              <RouterLink class="text-blue-700 hover:underline" :to="`/logs/${row.id}`">{{ row.path }}</RouterLink>
            </td>
            <td class="px-3 py-2">{{ row.status_code }}</td>
            <td class="px-3 py-2">{{ row.model ?? "—" }}</td>
            <td class="px-3 py-2">{{ row.duration_ms }} ms</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-3 text-sm text-muted-foreground">Total: {{ total }}</p>
  </div>
</template>
