<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { clearToken, getToken } from "@/lib/api";

const router = useRouter();
const route = useRoute();
const signedIn = computed(() => Boolean(getToken()) || route.name !== "login");

function logout() {
  clearToken();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen">
    <header v-if="signedIn" class="border-b bg-card">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-6">
          <span class="text-sm font-semibold">cursor-sdk-to-openai</span>
          <nav class="flex gap-4 text-sm">
            <RouterLink class="hover:underline" to="/logs">Logs</RouterLink>
            <RouterLink class="hover:underline" to="/endpoints">Endpoints</RouterLink>
          </nav>
        </div>
        <button class="text-sm text-muted-foreground hover:text-foreground" @click="logout">
          Sign out
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
