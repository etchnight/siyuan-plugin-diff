import * as Diff from "diff"; //声明文件已修改

export type Token = {
  type: "text" | "startTag" | "startTagEnd" | "attr" | "endTag";
  value: string;
};

export type DomChange = {
  objValue: Token[];
  added: boolean;
  removed: boolean;
  count: number;
  value: string;
};
export class DiffDom extends Diff.Diff<Element, Token> {
  tokenize = (div: Element): Token[] => {
    let tokens: Token[] = [];
    if (div.nodeType === Node.TEXT_NODE && div.textContent) {
      tokens = tokens.concat(
        div.textContent.split("").map((e) => {
          return { type: "text", value: e };
        })
      );
    } else {
      tokens.push({ type: "startTag", value: `<${div.nodeName}` });
      for (let attr of div.attributes) {
        //注意，前有空格
        tokens.push({ type: "attr", value: ` ${attr.name}="${attr.value}"` });
      }
      tokens.push({ type: "startTagEnd", value: `>` });
      for (let child of div.childNodes) {
        const child2 = child as Element;
        tokens = tokens.concat(this.tokenize(child2));
      }
      tokens.push({ type: "endTag", value: `</${div.nodeName}>` });
    }

    return tokens;
  };
  equals = (left: Token, right: Token) => {
    return left.type === right.type && left.value === right.value;
  };
  join = (tokens: Token[]) => {
    return tokens.map((e) => JSON.stringify(e) + ",\r\n").join("");
  };
  /**
   * postProcess 似乎不是自动运行的,总之不生效
   * @param changeObjs
   * @returns
   */
  diffDom = (oldEle: Element, newEle: Element, options?: any): DomChange[] => {
    const changeObjs = this.diff(oldEle, newEle, options);
    return changeObjs.map((e) => {
      const tokens = JSON.parse(`[${e.value.slice(0, -3)}]`) as Token[];
      return {
        objValue: tokens.reduce((pre: Token[], cur, i, list) => {
          if (
            pre.length &&
            list[i - 1].type === "text" &&
            cur.type === "text"
          ) {
            pre[pre.length - 1].value += cur.value;
            return pre;
          } else {
            return pre.concat(structuredClone(cur));
          }
        }, []),
        added: e.added,
        removed: e.removed,
        count: e.count,
        value: tokens.reduce((pre, cur) => pre + cur.value, ""),
      };
    });
  };
}
//需要修改 Diff 类型文件为：
/* export class Diff<T,U> {
     //  diff(
      //    oldString: string,
     //     newString: string,
     //     options?: Callback | (ArrayOptions<any, any> & Partial<CallbackOptions>),
     // ): Change[]; 
      diff(
          oldString: T,
          newString: T,
          options?: Callback | (ArrayOptions<any, any> & Partial<CallbackOptions>),
      ): Change[];
  
      pushComponent(components: Change[], added: boolean, removed: boolean): void;
  
      extractCommon(
          basePath: BestPath,
          newString: string,
          oldString: string,
          diagonalPath: number,
      ): number;
  
      //equals(left: any, right: any): boolean;
      equals(left: U, right: U): boolean;
      removeEmpty(array: any[]): any[];
  
      castInput(value: any): any;
  
      //join(chars: string[]): string;
      join(chars: U[]): string;
  
      //tokenize(value: string): any; // return types are string or string[]
      tokenize(value: T): U[]; // return types are string or string[]
  } */
