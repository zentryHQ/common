/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  InlineWidgetNode,
  MarkdownLinkNode,
  Node,
  PlainTextNode,
} from "../ast";
import { NodeReplacer } from "./type";

export class SourceLinkNodeReplacer extends NodeReplacer {
  private _linkToTitle?: (link: string) => string | undefined;
  public constructor(config?: {
    linkToTitle?: (link: string) => string | undefined;
  }) {
    super();
    this._linkToTitle = config?.linkToTitle;
  }

  public override tryReplace(
    firstNodeInChain: Node,
    nodeIndex: number,
    nodes: ReadonlyArray<Node>,
  ): [Node, number] | undefined {
    if (!this._isValidSourceLink(firstNodeInChain)) return;

    const linkNodeChain: Node[] = [firstNodeInChain];

    for (let i = nodeIndex + 1; i < nodes.length; i++) {
      const node = nodes[i];
      if (this._isValidSourceLink(node)) {
        linkNodeChain.push(node);
        continue;
      }

      if (
        node instanceof PlainTextNode &&
        (node.value === "," || node.value === " ")
      ) {
        linkNodeChain.push(node);
        continue;
      }

      break;
    }

    const onlyLinks = linkNodeChain.filter(
      (l) => l instanceof MarkdownLinkNode,
    );
    if (onlyLinks.length === 0) {
      return;
    }

    const lastLinkIndex = (() => {
      for (let i = linkNodeChain.length - 1; i >= 0; i--) {
        if (this._isValidSourceLink(linkNodeChain[i])) {
          return i;
        }
      }
      return -1;
    })();

    const mapped = onlyLinks.map((l) => {
      const title =
        this._linkToTitle?.(l.value.link) ??
        this._resolveHostName(l.value.link);
      return {
        title,
        url: l.value.link,
      };
    });
    return [
      new InlineWidgetNode({
        name: "sourceLink",
        value: mapped,
      }),
      lastLinkIndex,
    ];
  }

  private _resolveHostName(link: string): string {
    try {
      return new URL(link).hostname;
    } catch {
      return "";
    }
  }

  private _isValidSourceLink(node: Node) {
    const valid =
      node instanceof MarkdownLinkNode &&
      (node.value.text.toLowerCase() === "source" ||
        !node.value.link.startsWith("https://"));
    return valid;
  }
}
