export abstract class Node {
  abstract print(): string;
}

export class NonTerminalNode extends Node {
  public constructor(public content: Node[] = []) {
    super();
  }

  public override print(): string {
    return this.content.reduce((prev, cur) => prev + cur.print(), "");
  }
}

export class TerminalNode<T> extends Node {
  public constructor(public value: T) {
    super();
  }

  public override print(): string {
    return String(this.value);
  }
}

export class ParagraphNode extends NonTerminalNode {}

export class MarkdownLinkNode extends TerminalNode<{
  text: string;
  link: string;
}> {
  print(): string {
    return `[${this.value.text}](${this.value.link})`;
  }
}

export class MarkdownWrapped extends TerminalNode<string> {
  public override print(): string {
    return this.value;
  }
}

// Delta node for values like +5%, -$1.38B, ↑4.48%
export interface DeltaValue {
  leftOver?: string;
  raw: string;
  direction: "positive" | "negative";
}

export class DeltaNode extends TerminalNode<DeltaValue> {
  public override print(): string {
    return `${this.value.raw}${this.value.leftOver}`;
  }
}

// Wrapper nodes for markdown formatting - contain a single child
// If child is DeltaNode, the replacer will swap out the entire wrapper

export class DoubleAsteriskNode extends NonTerminalNode {
  public override print(): string {
    return `**${super.print()}**`;
  }
}

export class DoubleUnderscoreNode extends NonTerminalNode {
  public override print(): string {
    return `__${super.print()}__`;
  }
}

export class SingleUnderscoreNode extends NonTerminalNode {
  public override print(): string {
    return `_${super.print()}_`;
  }
}

export class BacktickNode extends NonTerminalNode {
  public override print(): string {
    return `\`${super.print()}\``;
  }
}

export type InlineWidgetVariants =
  | {
      name: "tokenAddress";
      value: {
        tokenName: string;
        address: string;
      };
    }
  | {
      name: "deltaValue";
      value: {
        raw: string;
        direction: "positive" | "negative";
      };
    }
  | {
      name:
        | "userMention"
        | "projectMention"
        | "widgetMention"
        | "skillMention"
        | "sectorMention";
      value: string;
    }
  | {
      name: "sourceLink";
      value: {
        title: string;
        url: string;
      }[];
    };
export type InlineWidgetProps = InlineWidgetVariants & {
  leftOver?: string;
};

// 1. Helper to safely grab the value
type GetWidgetValue<TName, TVariants> = TVariants extends {
  name: infer N;
  value: infer V;
}
  ? TName extends N
    ? V
    : never
  : never;

// 2. The corrected output type
// Tyep is a little convoluted due to legacy reasons...
export type InlineWidgetNodeOutput<
  T extends InlineWidgetVariants["name"] = InlineWidgetVariants["name"],
> = T extends any
  ? {
      name: T;
      props: {
        value: GetWidgetValue<T, InlineWidgetVariants>;
      };
    }
  : never;

export class InlineWidgetNode extends TerminalNode<InlineWidgetProps> {
  public override print() {
    const { name, value, leftOver } = this.value;
    const pString =
      typeof value === "string" ? `"${value}"` : JSON.stringify(value);
    return `<inline-widget>{"name": "${name}", "props": {"value": ${pString}}}</inline-widget>${leftOver ?? ""}`;
  }
}

export class PlainTextNode extends TerminalNode<string> {}

export class zAST extends Node {
  public constructor(private _nodes: ParagraphNode[] = []) {
    super();
  }

  public getParagraphs() {
    return this._nodes;
  }

  public override print(): string {
    let output = "";
    for (let i = 0; i < this._nodes.length; i++) {
      output += this._nodes[i].print();
      if (i < this._nodes.length - 1) {
        output += "\n\n";
      }
    }
    return output;
  }
}
