import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "@/lib/api";
import LoginView from "@/views/LoginView.vue";
import LogsView from "@/views/LogsView.vue";
import LogDetailView from "@/views/LogDetailView.vue";
import EndpointsView from "@/views/EndpointsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/logs" },
    { path: "/login", name: "login", component: LoginView, meta: { guest: true } },
    { path: "/logs", name: "logs", component: LogsView, meta: { requiresAuth: true } },
    { path: "/logs/:id", name: "log-detail", component: LogDetailView, meta: { requiresAuth: true } },
    { path: "/endpoints", name: "endpoints", component: EndpointsView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const token = getToken();
  if (to.meta.requiresAuth && !token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guest && token) {
    return { name: "logs" };
  }
  return true;
});

export default router;
