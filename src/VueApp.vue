<template>
  <el-form
    :model="form"
    label-width="auto"
    :inline="false"
    @click.stop="(e) => e /**阻止窗口关闭 */"
  >
    <el-form-item label="原文档">
      <SelectBlock
        v-model:state="form.sourceTitle"
        :search-types="{
          document: true,
          heading: false,
          paragraph: false,
        }"
        @update="(item) => update(item, true)"
      ></SelectBlock>
    </el-form-item>
    <el-form-item label="新文档">
      <SelectBlock
        v-model:state="form.targetTitle"
        :search-types="{
          document: true,
          heading: false,
          paragraph: false,
        }"
        @update="(item) => update(item, false)"
      ></SelectBlock>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">开始比较</el-button>
    </el-form-item>
  </el-form>
  <Protyle
    :data="data"
    :tab-title="form.sourceTitle + '←→' + form.targetTitle"
  />
</template>

<script lang="ts" setup>
import SelectBlock, {
  BlockAC,
} from "../subMod/siyuanPlugin-common/vueComponent/SelectBlock.vue";
import Protyle from "./component/Protyle.vue";
import { ref } from "vue";
import { getDoc } from "../subMod/siyuanPlugin-common/siyuan-api/filetree";
import { BlockId } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import { queryBlockById } from "../subMod/siyuanPlugin-common/siyuan-api/query";
import { DiffBlock } from "./diffBlock";
import { DiffLine } from "./diffLine";
//const tabTitle = ref("");
export type Data = {
  source?: BlockId;
  sourceEle: Element | undefined;
  target?: BlockId;
  targetEle: Element | undefined;
  diffEle?: Element;
  mergeEle?: Element;
  duplicateId?: BlockId;
};
const data = ref<Data[]>([]);
// do not use same name with ref
const form = ref({
  source: "",
  sourceTitle: "",
  target: "",
  targetTitle: "",
});
const update = async (item: BlockAC, isSource: boolean) => {
  if (isSource) {
    form.value.source = item.rootID;
    form.value.sourceTitle = (await queryBlockById(item.rootID)).content;
  } else {
    form.value.target = item.rootID;
    form.value.targetTitle = (await queryBlockById(item.rootID)).content;
  }
};
const onSubmit = async () => {
  if (!form.value.source || !form.value.target) {
    return;
  }
  main();
};
const getBlockList = async (id: BlockId) => {
  const doc = await getDoc({ id: id });
  const div = document.createElement("div");
  div.innerHTML = doc.content;
  const blockList = div.querySelectorAll(
    "[data-node-id]:not([data-node-id] [data-node-id])"
  );
  return blockList;
};

const getId = (div: Element): BlockId => {
  if (!div) {
    return;
  }
  return div.getAttribute("data-node-id");
};
const getBlockContentList = (item: Element): Element[] => {
  return Array.from(
    item.querySelectorAll("[contenteditable]:not(.protyle-attr)")
  );
};
const buildData = (oneList: Element[], otherList: Element[]) => {
  const diffBlock = new DiffBlock();
  const diffLine = new DiffLine(true);
  let data: Data[] = diffBlock.patch(oneList, otherList);
  data = data.map((item) => {
    return {
      source: getId(item.sourceEle),
      target: getId(item.targetEle),
      sourceEle: item.sourceEle,
      targetEle: item.targetEle,
    };
  });
  const insStyle = `background-color: var(--b3-card-success-background); color: var(--b3-card-success-color);`;
  const delStyle = `background-color: var(--b3-card-error-background); color: var(--b3-card-error-color);`;
  data = data.map((item) => {
    //*块级更改
    if (!item.sourceEle) {
      item.diffEle = item.targetEle.cloneNode(true) as Element;
      item.diffEle.setAttribute("style", insStyle);
      item.mergeEle = item.targetEle.cloneNode(true) as Element;
      return item;
    }
    if (!item.targetEle) {
      item.diffEle = item.sourceEle.cloneNode(true) as Element;
      item.diffEle.setAttribute("style", delStyle);
      return item;
    }
    //*source将转换为merge结果，target转换为diff
    let source_merge = item.sourceEle.cloneNode(true) as Element;
    let target_diff = item.targetEle.cloneNode(true) as Element;
    //*行级更改
    const sourceList = getBlockContentList(source_merge);
    const targetList = getBlockContentList(target_diff);
    const patchs = diffBlock.patch(sourceList, targetList);
    /**
     * @returns isAfter 使用的是后面兄弟，说明要在其前面插入
     */
    const findBrother = (
      i: number,
      list: {
        sourceEle: Element;
        targetEle: Element;
      }[],
      isSource: boolean
    ) => {
      const key = isSource ? "sourceEle" : "targetEle";
      let offset = 1;
      let brother: Element;
      let isAfter = false;
      do {
        isAfter = !isAfter;
        //todo 是否可能都没有
        if (isAfter) {
          brother = list[i + offset] ? list[i + offset][key] : undefined;
        } else {
          brother = list[i - offset] ? list[i - offset][key] : undefined;
          offset++;
        }
      } while (!brother && offset < list.length);
      const parent = brother.parentElement;
      return { parent, isAfter };
    };
    patchs.forEach((line, i, list) => {
      //*增加行:复制兄弟块，替换内容，添加到父级（merge），在diff中标记为添加
      //*删除行:复制兄弟块，替换内容，添加到diff，并标记为删除，在merge中删除
      if (!line.sourceEle || !line.targetEle) {
        const ele = line.sourceEle || line.targetEle;
        const { parent, isAfter } = findBrother(i, list, !line.sourceEle);
        const parentClone = parent.cloneNode(true) as HTMLDivElement;
        getBlockContentList(parentClone)[0].replaceWith(ele.cloneNode(true));
        isAfter ? parent.before(parentClone) : parent.after(parentClone);
        if (!line.sourceEle) {
          line.targetEle.parentElement.setAttribute("style", insStyle);
        } else if (!line.targetEle) {
          parentClone.setAttribute("style", delStyle);
          line.sourceEle.parentElement.remove();
        }
        return;
      }
      //*字符级更改
      const diff = diffLine.diff(line.targetEle, line.sourceEle);
      diff.forEach((change) => {
        change.value = diffLine.mergeTokens(change.value);
      });
      //console.log("diff", diff);
      const diffEle = diffLine.patchDiff(diff);
      const mergeEle = diffLine.patchMerge(diff);
      //!特别下列替换，即merge使用原容器，diff使用新容器
      line.sourceEle.replaceWith(mergeEle);
      line.sourceEle = mergeEle;
      line.targetEle.replaceWith(diffEle);
      line.targetEle = diffEle;
    });
    return {
      source: item.source,
      target: item.target,
      sourceEle: item.sourceEle,
      targetEle: item.targetEle,
      mergeEle: source_merge,
      diffEle: target_diff,
      //duplicateId:重复文档后再添加
    };
  });
  return data;
  console.table(
    data.map((e) => {
      return {
        source: e.sourceEle?.outerHTML,
        target: e.targetEle?.outerHTML,
        diff: e.diffEle?.outerHTML,
        merge: e.mergeEle?.outerHTML,
      };
    })
  );
};
const main = async () => {
  const sourceBlockList = (await getBlockList(
    form.value.source
  )) as NodeListOf<HTMLElement>;
  const targetBlockList = (await getBlockList(
    form.value.target
  )) as NodeListOf<HTMLElement>;
  data.value = buildData(
    Array.from(sourceBlockList),
    Array.from(targetBlockList)
  );
  /*   const outputDoc = await duplicateDoc(form.value.source);
  const outputBlockList = (await getBlockList(
    outputDoc.id
  )) as NodeListOf<HTMLElement>;
  let index = 0;
  data.value.forEach((e, _i) => {
    if (!e.sourceEle) {
      return;
    }
    index++;
    e.duplicateId = getId(outputBlockList[index]);
  }); */
  //tabTitle.value = `←→`; //*触发更新动作
};
</script>
<style></style>
