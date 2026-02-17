import { MarkdownLinkNode, Node, PlainTextNode } from '../ast';
import { Token } from '../z-tokenizer';
import { Parselet } from './parselet';

export class LinkParselet extends Parselet {
    public override parse(
        tokens: ReadonlyArray<Token>,
        i: number
    ): [Node, number] | undefined {
        if (tokens[i].tok !== '[') return;

        let text = '[';
        i++;

        while (i < tokens.length) {
            text += tokens[i].value;
            i++;
            if (tokens[i - 1].tok === ']') break;
        }

        let link = '';
        if (tokens.at(i)?.tok === '(') {
            while (i < tokens.length) {
                link += tokens[i]?.value ?? '';
                i++;
                if (tokens[i - 1]?.tok === ')') break;
            }
        }

        if (text.length < 2 || link.length < 2) {
            return [new PlainTextNode(text + link), i];
        }

        return [
            new MarkdownLinkNode({
                link: link.substring(1, link.length - 1),
                text: text.substring(1, text.length - 1),
            }),
            i,
        ];
    }
}
