<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { clearToken, getToken } from "@/lib/api";
import { initTheme, resolveTheme, toggleTheme, type ThemeMode } from "@/lib/theme";

const router = useRouter();
const route = useRoute();
const signedIn = computed(() => Boolean(getToken()) || route.name !== "login");
const theme = ref<ThemeMode>(resolveTheme());

onMounted(() => {
  theme.value = initTheme();
});

function onToggleTheme() {
  theme.value = toggleTheme();
}

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
            <RouterLink class="hover:underline" to="/logs">Requests</RouterLink>
            <RouterLink class="hover:underline" to="/endpoints">Endpoints</RouterLink>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-md border px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="onToggleTheme"
          >
            {{ theme === "dark" ? "Light" : "Dark" }}
          </button>
          <button class="text-sm text-muted-foreground hover:text-foreground" @click="logout">
            Sign out
          </button>
        </div>
      </div>
    </header>
    <div v-else class="absolute right-4 top-4">
      <button
        type="button"
        class="rounded-md border bg-card px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="onToggleTheme"
      >
        {{ theme === "dark" ? "Light" : "Dark" }}
      </button>
    </div>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
