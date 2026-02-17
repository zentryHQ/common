import { DeltaNode, Node } from '../ast';
import { Token } from '../z-tokenizer';
import { Parselet } from './parselet';

const CURRENCY_SYMBOLS = new Set(['$', '€', '£', '¥']);
const SUFFIXES = new Set(['%', 'K', 'M', 'B', 'T', 'k', 'm', 'b', 't']);

function isDigit(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return code >= 48 && code <= 57; // 0-9
}

function isValidValueChar(ch: string): boolean {
    return isDigit(ch) || ch === '.' || ch === ',';
}

/**
 * Parses a string to detect delta value patterns like:
 * - `+5`, `-100` (plain numbers)
 * - `↑4.48%`, `↓8.80%` (percentages with arrows)
 * - `+$220M`, `-$1.38B` (currency with magnitude suffix)
 * - `up 5%`, `down 10B` (natural language with optional space)
 *
 * Returns the parsed delta value and any leftover text, or null if no match.
 */
export class DeltaParselet extends Parselet {
    public parse(
        tokens: ReadonlyArray<Token>,
        i: number
    ): [Node, number] | undefined {
        const text = tokens[i].value;

        // Try direct match first (single token)
        const got = DeltaParselet._parse(text);
        if (got) return [got, i + 1];

        // Try multi-token match: "up/down" followed by optional space then the rest
        const lowerText = text.toLowerCase();
        const isPositive = ['↑', '+', 'up'].includes(lowerText);
        const isNegative = ['↓', '-', 'down'].includes(lowerText);

        if (isPositive || isNegative) {
            let nextI = i + 1;
            let combined = text;

            // Optional space token
            if (tokens[nextI]?.tok === ' ') {
                combined += tokens[nextI].value;
                nextI++;
            }

            // Case A: The next token is a wrapper (** or __ or `)
            const nextTok = tokens[nextI];
            if (nextTok && ['**', '__', '`'].includes(nextTok.tok)) {
                const wrapper = nextTok.tok;
                let innerI = nextI + 1;
                let innerText = '';
                while (
                    innerI < tokens.length &&
                    tokens[innerI].tok !== wrapper
                ) {
                    innerText += tokens[innerI].value;
                    innerI++;
                }

                if (innerI < tokens.length && tokens[innerI].tok === wrapper) {
                    // We found a complete wrapper. Check if prefix + innerText + optional closing wrapper part is a delta
                    // Actually, if we consume the wrapper, the 'raw' should ideally include the prefix and the content
                    const result = DeltaParselet._parse(combined + innerText);
                    if (result && result.value.leftOver === '') {
                        // Success! Return the node and skip including the closing marker
                        return [result, innerI + 1];
                    }
                }
            }

            // Case B: Simple lookahead (already handled by previous implementation but kept for "up x%")
            if (tokens[nextI]) {
                const rest = tokens[nextI].value;
                const result = DeltaParselet._parse(combined + rest);
                if (result) {
                    return [result, nextI + 1];
                }
            }
        }

        return;
    }

    /**
     * Checks if the entire string is a delta pattern (no leftover allowed).
     * Used for checking content inside wrapper nodes.
     */
    public static isExactDeltaPattern(text: string): DeltaNode | undefined {
        const result = this._parse(text);
        if (result && result.value.leftOver === '') {
            return result;
        }
    }

    private static _parse(text: string) {
        if (text.length < 2) return;

        const lowerText = text.toLowerCase();
        let isPositive = false;
        let isNegative = false;
        let prefixLength = 0;
        let isWordPrefix = false;

        // 1. Check for symbol prefixes
        const symbolPrefix = text[0];
        if (['↑', '+'].includes(symbolPrefix)) {
            isPositive = true;
            prefixLength = 1;
        } else if (['↓', '-'].includes(symbolPrefix)) {
            isNegative = true;
            prefixLength = 1;
        } else {
            // 2. Check for word prefixes
            if (lowerText.startsWith('up ')) {
                isPositive = true;
                prefixLength = 3;
                isWordPrefix = true;
            } else if (lowerText.startsWith('down ')) {
                isNegative = true;
                prefixLength = 5;
                isWordPrefix = true;
            }
        }

        if (!isPositive && !isNegative) {
            return;
        }

        let j = prefixLength;

        // Skip the required space for word prefixes (already checked in startsWith)
        // For symbols, no space is allowed after the prefix normally, but let's stick to existing logic for symbols

        // Prevent double prefix (e.g., "++5", "up+5")
        if (j < text.length) {
            const nextChar = text[j];
            if (['↑', '+', '↓', '-'].includes(nextChar)) {
                return;
            }
        }

        // Optional currency symbol (Symbols only)
        if (!isWordPrefix && j < text.length && CURRENCY_SYMBOLS.has(text[j])) {
            j++;
        }

        // Must have at least one digit
        if (j >= text.length || !isDigit(text[j])) {
            return;
        }

        // Collect the numeric part (digits, dots, commas)
        let hasDigit = false;
        while (j < text.length && isValidValueChar(text[j])) {
            if (isDigit(text[j])) hasDigit = true;
            j++;
        }

        if (!hasDigit) {
            return;
        }

        // Optional suffix (Word prefixes ONLY support %)
        if (j < text.length) {
            const suffix = text[j];
            if (isWordPrefix) {
                if (suffix !== '%') return; // Strict % for up/down
                j++;
            } else if (SUFFIXES.has(suffix)) {
                // Symbols support all suffixes
                j++;
            }
        } else if (isWordPrefix) {
            // up/down REQUIRES a percent suffix as per simplified request
            return;
        }

        const raw = text.substring(0, j);
        const leftOver = text.substring(j);
        const direction = isPositive ? 'positive' : 'negative';

        return new DeltaNode({
            direction,
            leftOver,
            raw,
        });
    }
}
