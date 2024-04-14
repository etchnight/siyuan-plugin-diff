<template></template>
<script lang="ts" setup>
import { onUpdated } from "vue";
import { App, Protyle, openTab } from "siyuan";
import { type Data } from "../VueApp.vue";
import {
  buildParaBlock,
  buildSuperBlock,
} from "../../subMod/siyuanPlugin-common/component/blockEle";

import { ISiyuan } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
declare const siyuan: ISiyuan;
const props = defineProps<{
  data: Data[];
  tabTitle: string;
}>();

onUpdated(async () => {
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
  console.log("tab", tab);
  const protyle = new Protyle(siyuan.ws.app, tab.panelElement, {
    after(protyle) {
      //?虽然没什么作用但是必须要有
      console.log(protyle);
    },
  });
  while (protyle.isUploading()) {
    await sleep(150);
  }

  console.log("protyle", protyle);
  for (let item of props.data) {
    const diff = item.diffEle || buildParaBlock("");
    const merge = item.mergeEle || buildParaBlock("");
    const source = item.sourceEle || buildParaBlock("");
    let superBlock = buildSuperBlock("col", [
      source.outerHTML,
      diff.outerHTML,
      merge.outerHTML,
    ]);
    protyle.protyle.wysiwyg.element.appendChild(superBlock);
  }
});
function sleep(timeout: number) {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout);
  });
}
</script>
