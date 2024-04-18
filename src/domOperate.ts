/**
 * protyle 中dom相关操作
 */
import { type Lute as LUTE } from "siyuan";
declare const Lute: typeof LUTE;
export enum EAttrClass {
  preSource = "protyle-attr--pre-source",
  source = "protyle-attr--source",
  noDiff = "protyle-attr--no-diff",
}
export const getDomMemo = (superBlock: Element, className: EAttrClass) => {
  const attr = superBlock.children.item(3)?.querySelector(`.${className}`);
  if (!attr) {
    return;
  }
  const preSourceId = attr.getAttribute("aria-label");
  return preSourceId;
};
export const setDomMemo = (
  superBlock: Element,
  value: string,
  className: EAttrClass
) => {
  const attr = superBlock.children
    .item(3)
    ?.querySelector(`.${className}`) as HTMLElement;
  if (!attr) {
    return;
  }
  attr.setAttribute("aria-label", value);
  for (let child of attr.childNodes) {
    if (
      child.nodeName === "#text" &&
      child.textContent.length === value.length
    ) {
      child.textContent = value;
      break;
    }
  }
};

export const createDomMemo = (
  superBlock: Element,
  value: string,
  className: EAttrClass
) => {
  const attrDiv = superBlock.children.item(3);
  if (!attrDiv) {
    return;
  }
  const linkIdDIv = document.createElement("div");
  linkIdDIv.innerHTML = `<div class="${className} b3-tooltips b3-tooltips__sw protyle-attr--memo" aria-label="${value}">
    <svg><use xlink:href="#iconM"></use></svg>
    </div>`;
  const result = linkIdDIv.firstChild as HTMLDivElement;
  result.append(value);
  attrDiv.appendChild(result);
};

export const removeDomMemo = (superBlock: Element, className: EAttrClass) => {
  const attr = superBlock.children.item(3)?.querySelector(`.${className}`);
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
