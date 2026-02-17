import { MarkdownWrapped, Node } from '../ast';
import { Token, TokenType } from '../z-tokenizer';
import { Parselet } from './parselet';

export class MarkdownWrappedParselet extends Parselet {
    public accept(tok: TokenType): boolean {
        return tok === '```';
    }
    public parse(
        tokens: ReadonlyArray<Token>,
        i: number
    ): [Node, number] | undefined {
        if (tokens[i].tok !== '```') return;

        let content = tokens[i].value;
        i++;
        while (i < tokens.length && tokens[i].tok !== '```') {
            content += tokens[i].value;
            i++;
        }
        if (i < tokens.length) {
            content += tokens[i].value;
            i++;
        }
        return [new MarkdownWrapped(content), i];
    }
}
