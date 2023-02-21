/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue"
  import Vue from "vue";
import VueQrcodeReader from "vue-qrcode-reader";

Vue.use(VueQrcodeReader);
  const component: DefineComponent<{}, {}, any>
  export default component
}
