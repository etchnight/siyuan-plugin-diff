<template></template>
<script lang="ts" setup>
import { onUpdated } from "vue";
import { openTab, showMessage } from "siyuan";
import { type Data } from "../VueApp.vue";
import {
  buildParaBlock,
  buildSuperBlock,
} from "../../subMod/siyuanPlugin-common/component/blockEle";
import {
  insertBlock,
  updateBlock,
} from "../../subMod/siyuanPlugin-common/siyuan-api/block";
const props = defineProps<{
  data: Data[];
  docId: string;
}>();

onUpdated(async () => {
  if (!props.docId) {
    return;
  }
  openTab({
    app: window.siyuan.ws.app,
    doc: {
      id: props.docId,
    },
    keepCursor: false,
    async afterOpen() {
      let i = 0;
      const step = 10; //n个一组
      while (i < props.data.length) {
        showMessage(`生成比较文档${i}/${props.data.length}`, 3000);
        const group = props.data.slice(i, i + step);
        await Promise.all(
          group.map(async (e) => {
            if (e.isNoDiff) {
              return;
            }
            const diff = e.diff[0] || buildParaBlock("");
            const merge = e.merge[0] || buildParaBlock("");
            let superBlock = buildSuperBlock("col", [
              e.sourceEle.outerHTML,
              diff.outerHTML,
              merge.outerHTML,
            ]);
            await updateBlock({
              dataType: "dom",
              data: superBlock.outerHTML,
              id: e.duplicateId,
            });
            let preId = e.duplicateId;
            for (let i = 1; i < e.target.length; i++) {
              superBlock = buildSuperBlock("col", [
                buildParaBlock("").outerHTML,
                e.diff[i].outerHTML,
                e.merge[i].outerHTML,
              ]);
              await insertBlock({
                dataType: "dom",
                data: superBlock.outerHTML,
                previousID: preId,
              });
              preId = superBlock.getAttribute("data-node-id");
            }
          })
        );
        i = i + step;
      }
    },
  });
});

function sleep(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
</script>
