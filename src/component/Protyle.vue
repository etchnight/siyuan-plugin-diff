<template>
  <div :id="divId"></div>
  <div>AAA</div>
</template>
<script lang="ts" setup>
import { onUnmounted, onMounted, ref } from "vue";
import { Protyle } from "siyuan";

const props = defineProps<{
  blockId: string;
}>();
const divId = `PluginDiff-${props.blockId}`;
const html = ref("");
let protyle: Protyle;
onMounted(() => {
  let tempDiv = document.querySelector("#div") as HTMLElement;
  console.log(tempDiv);

  protyle = new Protyle(window.siyuan.ws.app, tempDiv, {
    blockId: props.blockId,
    mode: "wysiwyg",
    render: {
      title: false,
      gutter: false,
      breadcrumb: false,
      breadcrumbDocName: false,
    },
    after: async (protyle) => {
      const content = protyle.protyle.contentElement;
      if (!content) {
        return;
      }

      //按道理讲 protyle 已经加载完成，但是加载符号仍然存在，这里等待一点时间
      await sleep(500);
      const wysiwyg = content.querySelector(".protyle-wysiwyg") as HTMLElement;
      if (wysiwyg) {
        wysiwyg.setAttribute("style", "padding: 1px 1px 1px 1px !important;");
      }
      html.value = content.outerHTML;
    },
  });
});

function sleep(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

onUnmounted(() => {
  protyle.destroy();
});
</script>
