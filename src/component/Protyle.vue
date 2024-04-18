<template></template>
<script lang="ts" setup>
import { App, Protyle, openTab } from "siyuan";
import { type Data } from "../VueApp.vue";
import {
  buildParaBlock,
  buildSuperBlock,
} from "../../subMod/siyuanPlugin-common/component/blockEle";

import { ISiyuan } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { createSourceId, resetId } from "../domOperate";
declare const siyuan: ISiyuan;
const props = defineProps<{
  data: Data[];
  tabTitle: string;
}>();

const updateProtyle = async () => {
  if (!props.data || props.data.length == 0) {
    return;
  }
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
  //console.log("tab", tab);
  const protyle = new Protyle(siyuan.ws.app, tab.panelElement, {
    after(protyle) {
      //?虽然没什么作用但是必须要有
      console.log(protyle);
    },
  });
  while (protyle.isUploading()) {
    await sleep(150);
  }
  protyle.protyle.element.classList.add("plugin-diff");
  //console.log("protyle", protyle);
  let preSourceId = "";
  for (let item of props.data) {
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
      createSourceId(superBlock, preSourceId, true);
    }
    protyle.protyle.wysiwyg.element.appendChild(superBlock);
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
