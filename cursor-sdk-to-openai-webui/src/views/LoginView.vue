<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { login } from "@/lib/api";

const router = useRouter();
const route = useRoute();
const username = ref("armin");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await login(username.value, password.value);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/logs";
    await router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
    <h1 class="text-xl font-semibold">Admin sign in</h1>
    <p class="mt-1 text-sm text-muted-foreground">View API logs and endpoint reference.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block text-sm">
        Username
        <input v-model="username" class="mt-1 w-full rounded-md border px-3 py-2" autocomplete="username" />
      </label>
      <label class="block text-sm">
        Password
        <input
          v-model="password"
          type="password"
          class="mt-1 w-full rounded-md border px-3 py-2"
          autocomplete="current-password"
        />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </div>
</template>
