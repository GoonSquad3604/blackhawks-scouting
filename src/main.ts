import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import { Buffer } from 'buffer';

createApp(App).use(router).use(createPinia()).mount("#app");
