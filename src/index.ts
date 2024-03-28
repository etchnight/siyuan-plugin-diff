import { Menu, Plugin } from "siyuan";
import { createApp, type App } from "vue";
import VueApp from "./VueApp.vue";
import ElementPlus from "element-plus";
const STORAGE_NAME = "menu-config";
//const DOCK_TYPE = "dock_tab";

export default class PluginDiff extends Plugin {
  async onload() {
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
    this.addIcons(`<symbol id="iconDiff">
    <svg viewBox="0 0 1024 1024" version="1.1" width="16" height="16">
      <path style="stroke:none;fill-rule:nonzero;"
        d="M476 399.1c0-3.9-3.1-7.1-7-7.1h-42c-3.8 0-7 3.2-7 7.1V484h-84.5c-4.1 0-7.5 3.1-7.5 7v42c0 3.8 3.4 7 7.5 7H420v84.9c0 3.9 3.2 7.1 7 7.1h42c3.9 0 7-3.2 7-7.1V540h84.5c4.1 0 7.5-3.2 7.5-7v-42c0-3.9-3.4-7-7.5-7H476v-84.9zM560.5 704h-225c-4.1 0-7.5 3.2-7.5 7v42c0 3.8 3.4 7 7.5 7h225c4.1 0 7.5-3.2 7.5-7v-42c0-3.8-3.4-7-7.5-7z m-7.1-502.6c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v704c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32V397.3c0-8.5-3.4-16.6-9.4-22.6L553.4 201.4zM664 888H232V264h282.2L664 413.8V888z m190.2-581.4L611.3 72.9c-6-5.7-13.9-8.9-22.2-8.9H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h277l219 210.6V824c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V329.6c0-8.7-3.5-17-9.8-23z"
      ></path>
    </svg>
  </symbol>`);
    console.log(this.i18n.helloPlugin);
  }

  onLayoutReady() {
    // this.loadData(STORAGE_NAME);
    let vueApp: App<Element>;
    const ele = document.createElement("div");
    vueApp = createApp(VueApp);
    vueApp.use(ElementPlus);
    vueApp.mount(ele);
    this.addTopBar({
      icon: "iconDiff",
      title: "文档差异比较与合并",
      position: "right",
      callback: async (event) => {
        const menu = new Menu("PluginDiff");
        menu.addItem({
          element: ele,
        });
        menu.open({ x: event.x, y: event.y });
      },
    });
  }

  async onunload() {
    console.log(this.i18n.byePlugin);
  }

  uninstall() {
    console.log("uninstall");
  }
}
