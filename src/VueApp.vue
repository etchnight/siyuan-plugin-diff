<template>
  <!--<Protyle blockId="20240326205051-c8uzljf"></Protyle>-->
  <el-form
    :model="form"
    label-width="auto"
    :inline="false"
    style="width: 300px"
  >
    <el-form-item label="原文档">
      <SelectBlock
        v-model:state="form.sourceTitle"
        @update="(item) => update(item, true)"
      ></SelectBlock>
    </el-form-item>
    <el-form-item label="新文档">
      <SelectBlock
        v-model:state="form.targetTitle"
        @update="(item) => update(item, false)"
      ></SelectBlock>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">开始比较</el-button>
    </el-form-item>
  </el-form>
  <Protyle :data="data" :doc-id="docId" />
</template>

<script lang="ts" setup>
import SelectBlock, {
  BlockAC,
} from "../subMod/siyuanPlugin-common/vueComponent/SelectBlock.vue";
import Protyle from "./component/Protyle.vue";
import { ref } from "vue";
import {
  duplicateDoc,
  getDoc,
} from "../subMod/siyuanPlugin-common/siyuan-api/filetree";
import { BlockId } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import { queryBlockById } from "../subMod/siyuanPlugin-common/siyuan-api/query";
import * as Diff from "diff";
const docId = ref("");
export type Data = {
  source: BlockId;
  sourceEle: HTMLElement;
  target: BlockId[];
  targetEle: HTMLElement[];
  diff: HTMLElement[];
  merge: HTMLElement[];
  duplicateId?: BlockId;
  isNoDiff: boolean;
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

const isSameLine = (
  diff: Diff.Change[],
  oldBlock: string,
  newBlock: string
) => {
  const length = oldBlock.length + newBlock.length;
  const diffCount = diff.reduce((pre, cur) => {
    return cur.added || cur.removed ? pre + cur.count : pre;
  }, 0);
  return diffCount < length / 2;
};
const buildMerge = (diffs: Diff.Change[]) => {
  const div = document.createElement("div");
  let innerHTML = "";
  for (let diff of diffs) {
    let html: string = "";
    if (diff.added) {
      html = diff.value;
    } else if (diff.removed) {
      //只保留标签，不保留文本
      if ((diff.count || 0) < diff.value.length) {
        const spans = diff.value.match(/<\/?[A-Z]{1,}.*?>/g);
        if (spans) {
          html = spans.reduce((pre, cur) => {
            //不保留块标识
            if (cur.search("data-node-id") !== -1) {
              return pre;
            } else {
              return pre + cur;
            }
          }, "");
        }
      }
    } else {
      html = diff.value;
    }
    innerHTML = innerHTML + html;
  }
  div.innerHTML = innerHTML;
  const child = div.firstChild as HTMLElement;
  return child;
};
const insStyle = `background-color: var(--b3-card-success-background); color: var(--b3-card-success-color);`;
const delStyle = `background-color: var(--b3-card-error-background); color: var(--b3-card-error-color);`;
const buildDiff = (diffs: Diff.Change[]) => {
  const div = document.createElement("div");
  let innerHTML = "";
  for (let diff of diffs) {
    //处理含有标签的节点
    if ((diff.count || 0) < diff.value.length) {
      if (diff.removed) {
        if (diff.count && diff.count > 1) {
          innerHTML += `<span style="${delStyle}">${diff.value.replace(
            /<\/?[A-Z]{1,}.*?>/g,
            ""
          )}</span>`;
        }
      } else {
        innerHTML += diff.value;
      }
      continue;
    }
    if (diff.added) {
      innerHTML += `<span style="${insStyle}">${diff.value}</span>`;
    } else if (diff.removed) {
      innerHTML += `<span style="${delStyle}">${diff.value}</span>`;
    } else {
      innerHTML += `${diff.value}`;
    }
  }
  div.innerHTML = innerHTML;
  const child = div.firstChild as HTMLElement;
  return child;
};
function tokenize(value: string) {
  const div = document.createElement("div");
  div.innerHTML = value;
  let tokens: string[] = [];
  for (let child of div.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent) {
      tokens = tokens.concat(child.textContent.split(""));
    } else {
      const child2 = child as Element;
      const tagSuffix = `</${child2.nodeName}>`;
      let tagPrefix = ``;
      for (let attr of child2.attributes) {
        tagPrefix += ` ${attr.name}="${attr.value}"`;
      }
      tagPrefix = `<${child2.tagName}${tagPrefix}>`;
      tokens = tokens.concat(tagPrefix, tokenize(child2.innerHTML), tagSuffix);
    }
  }
  return tokens;
}
const offsetLimit = 20;
const getId = (div: HTMLElement): BlockId => {
  return div.getAttribute("data-node-id");
};
const buildData = (oneList: HTMLElement[], otherList: HTMLElement[]) => {
  const diffCustom = new Diff.Diff(); //专为HTML（而非innerText）准备的
  diffCustom.tokenize = tokenize;
  data.value = [];
  for (let i = 0; i < oneList.length; i++) {
    let diff: Diff.Change[];
    let sameFlag = false;
    let m = 0; //otherList 索引，处理过的全部删除
    do {
      diff = Diff.diffChars(oneList[i].innerText, otherList[m].innerText);
      sameFlag = isSameLine(diff, oneList[i].innerText, otherList[m].innerText);
      m++;
    } while (!sameFlag && otherList[m] && m < offsetLimit);
    if (sameFlag) {
      const diffHtml = diffCustom.diff(
        oneList[i].outerHTML,
        otherList[m - 1].outerHTML
      );
      //todo 将属性单独拿出来进行比较
      const isDiff = diffHtml
        .filter((e) => {
          return e.value.search("data-node-id") === -1;
        })
        .find((e) => {
          return e.added || e.removed;
        });
      data.value[i] = {
        source: getId(oneList[i]),
        sourceEle: oneList[i],
        target: [getId(otherList[m - 1])],
        targetEle: [otherList[m - 1]],
        diff: [buildDiff(diffHtml)],
        merge: [buildMerge(diffHtml)],
        isNoDiff: !isDiff,
      };
      const adds = otherList.splice(0, m - 1); //增加otherList相同项之前的
      otherList.shift(); //删除相同的项
      diffAdds(i, adds);
    } else {
      //删除
      data.value[i] = {
        source: getId(oneList[i]),
        sourceEle: oneList[i],
        target: [],
        targetEle: [],
        diff: [],
        merge: [],
        isNoDiff: false,
      };
    }
  }
  diffAdds(oneList.length - 1, otherList); //增加剩余项

  function diffAdds(i: number, adds: HTMLElement[]) {
    data.value[i].target = data.value[i].target.concat(
      adds.map((e) => getId(e))
    );
    data.value[i].targetEle = data.value[i].targetEle.concat(adds);
    data.value[i].merge = data.value[i].merge.concat(adds);
    data.value[i].diff = data.value[i].diff.concat(
      adds.map((e) => ((e.style.cssText = insStyle), e))
    );
  }
};
const main = async () => {
  const sourceBlockList = (await getBlockList(
    form.value.source
  )) as NodeListOf<HTMLElement>;
  const targetBlockList = (await getBlockList(
    form.value.target
  )) as NodeListOf<HTMLElement>;

  buildData(Array.from(sourceBlockList), Array.from(targetBlockList));
  const outputDoc = await duplicateDoc(form.value.source);
  console.log(data.value);
  const outputBlockList = (await getBlockList(
    outputDoc.id
  )) as NodeListOf<HTMLElement>;
  data.value.forEach((e, i) => {
    e.duplicateId = getId(outputBlockList[i]);
  });
  docId.value = outputDoc.id; //触发更新动作
};
</script>
<style></style>
