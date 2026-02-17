export type TokenType =
    | '['
    | ']'
    | '('
    | ')'
    | '`'
    | '```'
    | '**'
    | '__'
    | ' '
    | '\n'
    | 'text';

export type Token = {
    tok: TokenType;
    value: string;
    line: {
        offset: number; // line number (0-indexed)
        start: number; // start column (0-indexed)
        end: number; // end column (0-indexed)
    };
    pos: number; // absolute position in text
};

const SPECIAL_TOKENS: TokenType[] = [
    '```',
    '**',
    '__',
    '`',
    '[',
    ']',
    '(',
    ')',
    ' ',
    '\n',
];

export function* zTokenize(text: string): Generator<Token> {
    let pos = 0;
    let lineOffset = 0;
    let lineStartPos = 0;

    while (pos < text.length) {
        const startPos = pos;
        const currentLineOffset = lineOffset;
        const currentLineStart = pos - lineStartPos;

        let tok: TokenType | undefined;
        let value = '';

        for (const special of SPECIAL_TOKENS) {
            if (text.startsWith(special, pos)) {
                tok = special;
                value = special;
                pos += special.length;
                break;
            }
        }

        if (!tok) {
            tok = 'text';
            // Collect until next special token or end of text
            while (pos < text.length) {
                const isSpecial = SPECIAL_TOKENS.some((special) =>
                    text.startsWith(special, pos)
                );
                if (isSpecial) break;
                value += text[pos++];
            }
        }

        const token: Token = {
            tok,
            value,
            line: {
                offset: currentLineOffset,
                start: currentLineStart,
                end: currentLineStart + value.length,
            },
            pos: startPos,
        };

        yield token;

        if (tok === '\n') {
            lineOffset++;
            lineStartPos = pos;
        }
    }
}
