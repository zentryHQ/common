import { Node } from '../ast';
import { Token } from '../z-tokenizer';
import { zParser } from './z-parser';

export abstract class Parselet {
    public constructor(protected parser: zParser) {}
    /**
     * Given an array of tokens `tokens` and the index to begin parsing from `i`, returns
     * the parsed node and the next position the index shoule be in
     * @param tokens
     * @param i
     */
    abstract parse(
        tokens: ReadonlyArray<Token>,
        i: number
    ): [Node, number] | undefined;
}
