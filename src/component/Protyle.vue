<template></template>
<script lang="ts" setup>
import { App, Protyle, openTab, showMessage } from "siyuan";
import { type Data } from "../VueApp.vue";
import {
  buildParaBlock,
  buildSuperBlock,
} from "../../subMod/siyuanPlugin-common/component/blockEle";

import { ISiyuan } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { createDomMemo, resetId, EAttrClass, getDomMemo } from "../domOperate";
import { Ref, ref } from "vue";
declare const siyuan: ISiyuan;
const props = defineProps<{
  tabTitle: string;
  data: Data[];
}>();
const protyle: Ref<Protyle> = ref(null);
const buildButton = (label: string, icon: string, func: Function) => {
  const button = document.createElement("button");
  const breadcrumb = protyle.value.protyle.element.querySelector(
    ".protyle-breadcrumb"
  );
  breadcrumb.querySelector(".block__icon.fn__flex-center").before(button);
  button.innerHTML = `<svg><use xlink:href="#${icon}"></use></svg>`;
  button.setAttribute("aria-label", label);
  button.className = "block__icon fn__flex-center ariaLabel";
  button.addEventListener("click", () => {
    func();
  });
  return button;
};
const isSuperBlock = (selectBlock: Element) => {
  if (!selectBlock) {
    return false;
  }
  if (!selectBlock.parentElement) {
    return false;
  }
  return (
    selectBlock.getAttribute("data-type") === "NodeSuperBlock" &&
    selectBlock.parentElement.classList.contains("protyle-wysiwyg")
  );
};
const getNextChange = (forward: boolean = true) => {
  let selection = window.getSelection();
  let selectBlock = selection.anchorNode.parentElement;
  while (!isSuperBlock(selectBlock) && selectBlock.parentElement) {
    selectBlock = selectBlock.parentElement;
  }
  if (!isSuperBlock(selectBlock)) {
    return;
  }
  let nextBlock = selectBlock;
  while (nextBlock) {
    nextBlock = forward
      ? (nextBlock.nextElementSibling as HTMLElement)
      : (nextBlock.previousElementSibling as HTMLElement);
    if (nextBlock && !getDomMemo(nextBlock, EAttrClass.noDiff)) {
      break;
    }
  }
  if (!nextBlock) {
    return;
  }
  protyle.value.protyle.contentElement.scrollTo({
    top: nextBlock.offsetTop,
  });
  selection.removeAllRanges();
  const range = document.createRange();
  range.setStart(nextBlock.querySelector("[contenteditable]"), 0);
  selection.addRange(range);
};
const updateProtyle = async (data: Data[]) => {
  if (!data || data.length == 0) {
    return;
  }
  showMessage("正在组织输出...");
  const tab = await openTab({
    app: siyuan.ws.app as App,
    custom: {
      id: "siyuan-plugin-diff-custom", // 插件名称+页签类型：plugin.name + tab.type
      icon: "",
      title: props.tabTitle,
      data: undefined,
    },
    keepCursor: false,
    async afterOpen() {},
  });
  protyle.value = new Protyle(siyuan.ws.app, tab.panelElement, {
    after(protyle) {
      //?虽然没什么作用但是必须要有
      console.log(protyle);
    },
  });

  while (protyle.value.isUploading()) {
    await sleep(150);
  }

  protyle.value.protyle.element.classList.add("plugin-diff");
  buildButton("下一个更改", "iconDown", () => getNextChange(true));
  buildButton("上一个更改", "iconUp", () => getNextChange(false));
  let preSourceId = "";
  for (let item of data) {
    const diff = item.diffEle || buildParaBlock("");
    resetId(diff);
    diff.querySelectorAll("[data-node-id]").forEach((e) => resetId(e));
    const merge = item.mergeEle || buildParaBlock("");
    resetId(merge);
    merge.querySelectorAll("[data-node-id]").forEach((e) => resetId(e));
    const source = item.sourceEle || buildParaBlock("");
    let superBlock = buildSuperBlock("col", [
      source.outerHTML,
      diff.outerHTML,
      merge.outerHTML,
    ]);
    if (!item.source) {
      createDomMemo(superBlock, preSourceId, EAttrClass.preSource);
    }
    if (item.isNodiff) {
      createDomMemo(superBlock, "无更改", EAttrClass.noDiff);
    }
    protyle.value.protyle.wysiwyg.element.appendChild(superBlock);
    if (item.source) {
      preSourceId = item.source;
    }
  }
};
function sleep(timeout: number) {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout);
  });
}
defineExpose({
  updateProtyle,
});
</script>
