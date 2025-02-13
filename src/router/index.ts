import { createRouter, createWebHashHistory } from "vue-router";
import FormView from "@/views/FormView.vue";
import HomeView from "@/views/HomeView.vue";
import InspectorView from "@/views/InspectorView.vue";
import AnalysisView from "@/views/AnalysisView.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },
    {
      path: "/form",
      name: "form",
      component: FormView
    },
    {
      path: "/inspector",
      name: "inspector",
      component: InspectorView
    },
    {
      path: "/analysis",
      name: "analysis",
      component: AnalysisView
    }
  ]
});

export default router;
