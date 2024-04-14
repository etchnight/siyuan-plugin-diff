import * as Diff from "diff"; //声明文件已修改

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

export class DiffBlock extends Diff.Diff<Element[], Element> {
  tokenize = (div: Element[]) => {
    return div;
  };
  equals = (left: Element, right: Element) => {
    let leftText = left.textContent || "";
    let rightText = right.textContent || "";
    const diff = Diff.diffChars(leftText, rightText);
    return isSameLine(diff, leftText, rightText);
  };
  join(tokens: Element[]) {
    return tokens;
  }
  public patch(left: Element[], right: Element[]) {
    const diff = this.diff(left, right);
    let index = 0;
    for (let i = 0; i < diff.length; i++) {
      if (diff[i].added) {
        left.splice(
          index,
          0,
          ...new Array(diff[i].count).map((_) => undefined)
        );
      } else if (diff[i].removed) {
        right.splice(
          index,
          0,
          ...new Array(diff[i].count).map((_) => undefined)
        );
      }
      index += diff[i].count;
    }

    return left.map((e, i) => {
      return {
        sourceEle: e,
        targetEle: right[i],
      };
    });
  }
}
