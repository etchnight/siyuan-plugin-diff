import { IProtyle, Menu, Plugin, showMessage } from "siyuan";
import { createApp } from "vue";
import VueApp from "./VueApp.vue";
//import ElementPlus from "element-plus";
import { getBlockAttrs } from "../subMod/siyuanPlugin-common/siyuan-api/attr";
import {
  insertBlock,
  updateBlock,
} from "../subMod/siyuanPlugin-common/siyuan-api/block";
import { NodeType } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import "./element.css";
import {
  getSourceId,
  removeSourceId,
  resetId,
  setSourceId,
} from "./domOperate";
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
    this.eventBus.on("click-blockicon", this.blockIconEvent);

    // this.loadData(STORAGE_NAME);
    //let vueApp: App<Element>;
    const ele = document.createElement("div");
    ele.id = "plugin-diff";
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
    const vueApp = createApp(VueApp);
    //vueApp.use(ElementPlus);
    vueApp.mount(ele);
  }

  async onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEvent);
    console.log(this.i18n.byePlugin);
  }

  uninstall() {
    console.log("uninstall");
  }
  /**
   * @param param0
   */
  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: [HTMLElement]; protyle: IProtyle };
  }) => {
    console.log(detail);
    try {
      detail.protyle.element.classList;
    } catch (error) {
      console.log(error);
      return;
    }
    if (!detail.protyle.element.classList.contains("plugin-diff")) {
      return;
    }
    if (
      !detail.blockElements.some((e) => {
        return e.getAttribute("data-type") === "NodeSuperBlock";
      })
    ) {
      return;
    }
    /**
     * @deprecated
     * @param index
     */
    const update = async (index: number) => {
      Promise.all(
        detail.blockElements.map(async (superBlock) => {
          const dataType = superBlock.getAttribute("data-type") as NodeType;
          if (dataType !== "NodeSuperBlock") {
            return;
          }
          const blockId = superBlock.getAttribute("data-node-id");
          const attrs = await getBlockAttrs({ id: blockId });
          const sourceId = attrs["custom-diff-linkId"];
          if (!sourceId) {
            return;
          }
          const targetHtml = superBlock.children[index].outerHTML;
          await updateBlock({
            id: sourceId,
            dataType: "dom",
            data: targetHtml,
          });
        })
      );
      showMessage("更新完成");
    };
    /* {
            label: "使用左侧块更新",
            click: (_element: HTMLElement, _event: MouseEvent) => {
              update(0);
            },
            type: "submenu",
            icon: "",
          },*/
    const addToSource = async () => {
      for (let item of detail.blockElements) {
        if (item.getAttribute("data-type") !== "NodeSuperBlock") {
          continue;
        }
        //*获取插入位置
        const preSourceId = getSourceId(item, true);
        if (!preSourceId) {
          continue;
        }
        //*执行插入
        const mergeBlock = resetId(
          item.children.item(2).cloneNode(true) as Element
        );
        const res = await insertBlock({
          dataType: "dom",
          data: mergeBlock.outerHTML,
          previousID: preSourceId,
        });
        //*修改下一个连续插入内容插入位置
        const nextItem = item.nextSibling as Element;
        const currentId = res[0]?.doOperations[0]?.id;
        if (!nextItem || !currentId) {
          continue;
        }
        setSourceId(nextItem, currentId, true);
        //*修正文档显示错误
        removeSourceId(item, true);
        const parent = item.parentElement;
        item.firstElementChild.replaceWith(
          parent.querySelector(`[data-node-id='${currentId}']`)
        );
      }
    };
    if (
      detail.blockElements.some((e) => {
        return getSourceId(e, true);
      })
    ) {
      detail.menu.addItem({
        label: "将新增内容添加到原文档",
        icon: "",
        iconHTML: "",
        click(_element, _event) {
          addToSource();
        },
      });
    }
  };
}
