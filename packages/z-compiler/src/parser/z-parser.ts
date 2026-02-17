import { Node, ParagraphNode, PlainTextNode, zAST } from '../ast';
import { Token, zTokenize } from '../z-tokenizer';
import { DeltaParselet } from './delta-parselet';
import { LinkParselet } from './link-parselet';
import { MarkdownTextDecorationParselet } from './markdown-text-decoration-parselet';
import { MarkdownWrappedParselet } from './markdown-wrapped-parselet';
import { Parselet } from './parselet';

export class zParser {
  private _parselets: Parselet[];
  public constructor() {
    this._parselets = [
      new LinkParselet(this),
      new MarkdownTextDecorationParselet(this),
      new MarkdownWrappedParselet(this),
      new DeltaParselet(this),
    ];
  }
  public parse(text: string): zAST {
    const tokens: Token[] = [];
    const generator = zTokenize(text);
    while (true) {
      const t = generator.next();
      if (t.done) break;
      tokens.push(t.value);
    }

    const paragraphs: ParagraphNode[] = [];

    // all nodes under paragraphs.at(-1)
    let currentParagraphNodes: Node[] = [];

    let i = 0;
    outer: while (i < tokens.length) {
      for (const p of this._parselets) {
        const parsed = p.parse(tokens, i);
        if (!parsed) continue;

        const [node, nextI] = parsed;
        currentParagraphNodes.push(node);
        i = nextI;
        continue outer;
      }

      // Check for paragraph break (\n\n)
      if (tokens[i].tok === '\n' && i + 1 < tokens.length && tokens[i + 1].tok === '\n') {
        if (currentParagraphNodes.length > 0) {
          paragraphs.push(new ParagraphNode(currentParagraphNodes));
          currentParagraphNodes = [];
        }

        // Skip the sequence of newlines
        while (i < tokens.length && tokens[i].tok === '\n') {
          i++;
        }
        continue;
      }

      const defaultNode = new PlainTextNode(tokens[i].value);
      currentParagraphNodes.push(defaultNode);
      i++;
    }

    if (currentParagraphNodes.length > 0) {
      paragraphs.push(new ParagraphNode(currentParagraphNodes));
    }

    return new zAST(paragraphs);
  }
}
