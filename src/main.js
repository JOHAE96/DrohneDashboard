import { createApp } from "vue";
import { router } from "./routes";
import App from "./App.vue";
import "./index.css";

createApp(App).use(router).mount("#app");
