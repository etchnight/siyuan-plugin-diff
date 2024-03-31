<template>
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
import { DiffDom, Token, type DomChange } from "./diffDom";

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
/**
 * 保留旧的span标签，其他全部新增
 */
const buildMerge = (diffs: DomChange[]) => {
  const div = document.createElement("div");
  let innerHTML = "";
  for (let diff of diffs) {
    let html: string = "";
    if (diff.added) {
      html = diff.value;
    } else if (diff.removed) {
      //保留span标签及其内部属性
      let spanStart = false;
      for (let token of diff.objValue) {
        if (token.type === "startTag" && token.value === "<SPAN") {
          spanStart = true;
        }
        if (spanStart) {
          html += token.value;
        }
        if (token.type === "startTagEnd" && token.value === ">" && spanStart) {
          spanStart = false;
        }
        if (token.type === "endTag" && token.value === "</SPAN>") {
          html += token.value;
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
//todo 删除
const insStyle = `background-color: var(--b3-card-success-background); color: var(--b3-card-success-color);`;
const delStyle = `background-color: var(--b3-card-error-background); color: var(--b3-card-error-color);`;
/**
 * 生成差异，标签全部用新的，文字显示差异
 * - div中不允许插入span
 * - 原有span中不允许插入span
 * @param diffs
 */
const buildDiff = (diffs: DomChange[]) => {
  const div = document.createElement("div");
  let innerHTML: string[] = [];
  let isDivOpen = false;
  /**
   * 加入文本时标记是否在<DIV...>中,是的话不能添加diff标记(<span>)
   * 该错误一般是由零宽字符导致的，具体发生原因尚不明朗
   * @param token
   */
  const switchIsDivOpen = (token: Token) => {
    if (token.type === "startTag") {
      isDivOpen = true;
    }
    if (token.type === "startTagEnd") {
      isDivOpen = false;
    }
  };
  for (let diff of diffs) {
    if (diff.added) {
      for (let token of diff.objValue) {
        switchIsDivOpen(token);
        if (token.type === "text" && !isDivOpen) {
          innerHTML.push(`<span style="${insStyle}">${token.value}</span>`);
        } else {
          innerHTML.push(token.value);
        }
      }
    } else if (diff.removed) {
      for (let token of diff.objValue) {
        if (token.type === "text" && !isDivOpen) {
          innerHTML.push(`<span style="${delStyle}">${token.value}</span>`);
        }
      }
    } else {
      for (let token of diff.objValue) {
        switchIsDivOpen(token);
      }
      innerHTML.push(`${diff.value}`);
    }
  }
  div.innerHTML = innerHTML.join("");
  const child = div.firstChild as HTMLElement;
  mergeSpan(child);
  return child;
  /**
   * 后处理，将<span>部分1<span>部分2</span>部分3</span>合并
   * 预期结果<span>部分1<span><span>部分2<span><span>部分3<span>
   * @param ele
   */
  function mergeSpan(ele: Element) {
    for (let child of ele.children) {
      if (ele.tagName === "SPAN" && child.tagName === "SPAN") {
        //改变本级节点
        changeSpan(child.previousSibling, ele);
        changeSpan(child, ele);
        changeSpan(child.nextSibling, ele);
        //回退迭代
        //mergeSpan(ele.parentElement)
      }
      mergeSpan(child);
    }
    if (!ele.textContent && ele.tagName === "SPAN") {
      ele.remove();
    }
  }
  function changeSpan(child: Element | Node, ele: Element) {
    if (!child) {
      return;
    }
    let child2: Element;
    //改变子节点
    //@ts-ignore
    if (child.getAttribute) {
      child2 = child as Element;
      for (let attr of ele.attributes) {
        const value = child2.getAttribute(attr.name);
        child2.setAttribute(attr.name, `${attr.value} ${value || ""}`);
      }
    } else {
      child2 = document.createElement("span");
      for (let attr of ele.attributes) {
        child2.setAttributeNode(attr);
      }
      child2.parentElement.removeChild(child);
    }
    ele.before(child2);
    return child2;
  }
};

const offsetLimit = 20;
const getId = (div: HTMLElement): BlockId => {
  return div.getAttribute("data-node-id");
};
const buildData = (oneList: HTMLElement[], otherList: HTMLElement[]) => {
  const diffDom = new DiffDom();
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
      const diffHtml = diffDom.diffDom(oneList[i], otherList[m - 1]);
      //忽略的属性
      const unChangeAttr = ["data-node-id", "data-node-index", "updated"];
      const isDiff = diffHtml.find((e) => {
        if (!e.added && !e.removed) {
          return false;
        }
        for (let token of e.objValue) {
          if (token.type === "text") {
            continue;
          }
          if (
            unChangeAttr.find((e) => {
              return token.value.startsWith(` ${e}=`);
            })
          ) {
            return true;
          }
        }
        return false;
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
  console.log(data.value);
  const outputDoc = await duplicateDoc(form.value.source);
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
