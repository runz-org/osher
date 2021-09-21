// быстрый хак отсюда https://github.com/primefaces/primevue/issues/1128
// иначе не работает build
// todo: грохнуть, когда починят

import Vue from "vue";

declare module "vue" {
  export type PluginFunction<T> = (app: Vue.App, ...options: any[]) => any;
}
