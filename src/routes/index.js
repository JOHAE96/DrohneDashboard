import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/DrohneDashboard.vue";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
