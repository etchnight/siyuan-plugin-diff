/**
 * protyle 中dom相关操作
 */
import { type Lute as LUTE } from "siyuan";
declare const Lute: typeof LUTE;

const preSourceClass = "protyle-attr--preSource";
const sourceClass = "protyle-attr--source";
export const getSourceId = (superBlock: Element, isPrevious?: boolean) => {
  const attr = superBlock.children
    .item(3)
    ?.querySelector(`.${isPrevious ? preSourceClass : sourceClass}`);
  if (!attr) {
    return;
  }
  const preSourceId = attr.getAttribute("aria-label");
  return preSourceId;
};
export const setSourceId = (
  superBlock: Element,
  sourceId: string,
  isPrevious?: boolean
) => {
  const attr = superBlock.children
    .item(3)
    ?.querySelector(
      `.${isPrevious ? preSourceClass : sourceClass}`
    ) as HTMLElement;
  if (!attr) {
    return;
  }
  attr.setAttribute("aria-label", sourceId);
  for (let child of attr.childNodes) {
    if (
      child.nodeName === "#text" &&
      child.textContent.length === sourceId.length
    ) {
      child.textContent = sourceId;
      break;
    }
  }
};

export const createSourceId = (
  superBlock: Element,
  sourceId: string,
  isPrevious?: boolean
) => {
  const attrDiv = superBlock.children.item(3);
  if (!attrDiv) {
    return;
  }
  const linkIdDIv = document.createElement("div");
  linkIdDIv.innerHTML = `<div class="${
    isPrevious ? preSourceClass : sourceClass
  } b3-tooltips b3-tooltips__sw" aria-label="${sourceId}">
    <svg><use xlink:href="#iconM"></use></svg>
    </div>`;
  const result = linkIdDIv.firstChild as HTMLDivElement;
  result.append(sourceId);
  attrDiv.appendChild(result);
};

export const removeSourceId = (superBlock: Element, isPrevious?: boolean) => {
  const attr = superBlock.children
    .item(3)
    ?.querySelector(`.${isPrevious ? preSourceClass : sourceClass}`);
  if (!attr) {
    return;
  }
  attr.remove();
};

export const resetId = (ele: Element) => {
  if (ele.getAttribute("data-node-id")) {
    ele.setAttribute("data-node-id", Lute.NewNodeID());
  }
  return ele;
};
