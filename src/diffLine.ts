import * as Diff from "diff";
type Token = {
  type: string;
  value: string;
  dataType?: string[];
};
/**
 * 当两侧相等时，保留的是右侧的值，需要将入参位置调换
 */
export class DiffLine extends Diff.Diff<Element, Token> {
  private isReverse: boolean;
  constructor(reverse: boolean) {
    super();
    this.isReverse = reverse;
  }
  tokenize = (div: Element) => {
    const children = Array.from(div.childNodes);
    let result = children.flatMap((e) => {
      let attr = [];
      if (e.nodeName === "SPAN") {
        const span = e as HTMLSpanElement;
        attr = span.getAttribute("data-type")?.split(" ").sort();
      }
      return e.textContent.split("").map((char) => {
        return {
          type: e.nodeName,
          value: char,
          dataType: attr,
        };
      });
    });
    return result;
  };
  equals = (left: Token, right: Token) => {
    return left.value === right.value;
  };
  join(tokens: Token[]) {
    return tokens;
    /*     .map((e) => {
      return { type: e.type, value: e.value, dataType: new Set(e.dataType) };
    }); */
  }
  public patchDiff(
    diffs: {
      count?: number | undefined;
      value: Token[];
      added?: boolean | undefined;
      removed?: boolean | undefined;
    }[]
  ) {
    const insStyle = `background-color: var(--b3-card-success-background); color: var(--b3-card-success-color);`;
    const delStyle = `background-color: var(--b3-card-error-background); color: var(--b3-card-error-color);`;
    const sections = diffs.flatMap((item) => {
      const added = this.isReverse ? item.removed : item.added;
      const removed = this.isReverse ? item.added : item.removed;
      let style = "";
      if (added) {
        style = insStyle;
      }
      if (removed) {
        style = delStyle;
      }
      return item.value.map((e) => {
        return {
          type: added || removed ? "SPAN" : e.type,
          value: e.value,
          style: style,
          dataType: e.dataType,
        };
      });
    });
    const html = sections.reduce((pre, cur) => {
      let prefix =
        cur.type === "SPAN"
          ? `<span data-type='${cur.dataType.join(" ")}' style='${cur.style}'>`
          : "";
      let suffix = cur.type === "SPAN" ? "</span>" : "";
      return pre + `${prefix}${cur.value}${suffix}`;
    }, "");
    return this.patchOut(html);
  }
  public patchMerge(
    diffs: {
      count?: number | undefined;
      value: Token[];
      added?: boolean | undefined;
      removed?: boolean | undefined;
    }[]
  ) {
    const html = diffs.reduce((pre, cur) => {
      const added = this.isReverse ? cur.removed : cur.added;
      const removed = this.isReverse ? cur.added : cur.removed;
      if (removed) {
        return pre;
      } else {
        return (
          pre +
          cur.value.reduce((preValue, curValue) => {
            let prefix =
              curValue.type === "SPAN"
                ? `<span data-type='${curValue.dataType.join(" ")}'>`
                : "";
            let suffix = curValue.type === "SPAN" ? "</span>" : "";
            return preValue + `${prefix}${curValue.value}${suffix}`;
          }, "")
        );
      }
    }, "");
    return this.patchOut(html);
  }
  private patchOut(html: string) {
    let div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    div.setAttribute("spellcheck", "false");
    div.innerHTML = html;
    return div;
  }
  public mergeTokens(tokens: Token[]): Token[] {
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i + 1]) {
        break;
      }
      if (
        tokens[i].type === tokens[i + 1].type &&
        tokens[i].dataType.toString() === tokens[i + 1].dataType.toString()
      ) {
        tokens.splice(i, 2, {
          type: tokens[i].type,
          dataType: tokens[i].dataType,
          value: tokens[i].value + tokens[i + 1].value,
        });
        i--;
      }
    }
    return tokens;
  }
}
