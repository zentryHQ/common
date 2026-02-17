import { Node, zAST } from "./ast";
import { NodeReplacer, StatefulReplacer } from "./node-replacers";
import { zParser } from "./parser/z-parser";

export interface CompilerOptions {
  replacers: NodeReplacer[];
}

export class zCompiler {
  private _replacers: NodeReplacer[];
  private _parser: zParser;
  public constructor(options: CompilerOptions) {
    this._replacers = options.replacers;
    this._parser = new zParser();
  }

  public compile(text: string): string {
    const ast = this._parser.parse(text);
    const compiled = this._compile(ast);
    return compiled;
  }

  private _compile(ast: zAST): string {
    const paragraphs = ast.getParagraphs();
    for (const p of paragraphs) {
      const replaced = this._applyReplacers(p.content);
      p.content = replaced;
    }
    return ast.print();
  }

  private _applyReplacers(nodes: Node[]): Node[] {
    for (const replacer of this._replacers) {
      if (replacer instanceof StatefulReplacer) {
        replacer.reset();
      }
    }

    const finalNodes: Node[] = [];
    outer: for (let i = 0; i < nodes.length; i++) {
      for (const replacer of this._replacers) {
        const replacedWith = replacer.tryReplace(nodes[i], i, nodes);
        if (replacedWith) {
          const [elem, skip] = replacedWith;
          finalNodes.push(elem);
          i += skip;
          continue outer;
        }
      }

      finalNodes.push(nodes[i]);
    }

    return finalNodes;
  }
}
