import {
  DoubleAsteriskNode,
  DoubleUnderscoreNode,
  InlineWidgetNode,
  Node,
  NonTerminalNode,
  PlainTextNode,
} from "../ast";
import { isPricePattern } from "../utils/is-price-pattern";
import { NodeReplacer } from "./type";

const prefixComponentMap = {
  "@": "userMention",
  $: "projectMention",
  "#": "widgetMention",
  "/": "skillMention",
  "%": "sectorMention",
} as const;

function isNumber(s: string): boolean {
  return !isNaN(Number(s));
}

function isAllowedWidgetCharacters(ch: string) {
  const code = ch.charCodeAt(0);
  return (
    ch === "-" ||
    ch === "_" ||
    ch === "." ||
    (code >= 48 && code <= 57) || // 0–9
    (code >= 65 && code <= 90) || // A–Z
    (code >= 97 && code <= 122) // a–z
  );
}

export class SinglePrefixNodeReplacer extends NodeReplacer {
  public constructor(
    private _config?: {
      "@": boolean;
      $: boolean;
      "#": boolean;
      "/": boolean;
      "%": boolean;
    },
    private _inlineWidgetVisitor?: (node: InlineWidgetNode) => void,
  ) {
    super();
  }

  public tryReplace(node: Node): [Node, number] | undefined {
    // Handle wrapper nodes (**, __) - strip wrapper if content is a valid prefix mention
    // Note: BacktickNode is NOT included as backticks indicate code and should escape content
    if (
      node instanceof DoubleAsteriskNode ||
      node instanceof DoubleUnderscoreNode
    ) {
      return this._tryReplaceWrappedContent(node);
    }

    if (!(node instanceof PlainTextNode)) return;

    return this._tryReplacePlainText(node.value);
  }

  /**
   * Try to replace content inside wrapper nodes (**, __).
   * If the inner content starts with a valid prefix mention, strip the wrapper and return the widget.
   * Any leftover text after the mention is preserved.
   * Note: Backticks are NOT unwrapped as they indicate code and should escape content.
   */
  private _tryReplaceWrappedContent(
    node: NonTerminalNode,
  ): [Node, number] | undefined {
    // Recursively traverse wrapper nodes to find the innermost child
    const innermostChild = this._getInnermostChild(node);
    if (!innermostChild || !(innermostChild instanceof PlainTextNode)) {
      return;
    }

    const result = this._tryReplacePlainText(innermostChild.value);
    if (!result) return;

    return result;
  }

  /**
   * Recursively traverse wrapper nodes (**, __) to find the innermost child.
   * Note: Backticks are NOT traversed to preserve code escaping behavior.
   */
  private _getInnermostChild(node: NonTerminalNode): Node | undefined {
    if (node.content.length !== 1) return;

    const child = node.content[0];

    // If child is also a wrapper node, recurse into it
    if (
      child instanceof DoubleAsteriskNode ||
      child instanceof DoubleUnderscoreNode
    ) {
      return this._getInnermostChild(child);
    }

    return child;
  }

  /**
   * Core logic for replacing plain text with prefix mentions.
   */
  private _tryReplacePlainText(
    text: string,
  ): [InlineWidgetNode, number] | undefined {
    if (text.length <= 1) return;

    const prefix = text[0] as keyof typeof prefixComponentMap;
    if (prefix === "$" && isPricePattern(text)) {
      return;
    }

    const componentName = prefixComponentMap[prefix];

    if (!componentName || (this._config && !this._config[prefix])) {
      return;
    }

    // Check if second character is also a prefix (skip cases like "##")
    if (prefixComponentMap[text[1] as keyof typeof prefixComponentMap]) {
      return;
    }

    let collected = "";
    let i = 1;
    for (; i < text.length; i++) {
      if (!isAllowedWidgetCharacters(text[i])) break;
      collected += text[i];
    }

    if (collected.length === 0 || isNumber(collected)) {
      return;
    }

    const node = new InlineWidgetNode({
      name: componentName,
      value: collected,
      leftOver: text.substring(i),
    });

    this._inlineWidgetVisitor?.(node);

    return [node, 0];
  }
}
