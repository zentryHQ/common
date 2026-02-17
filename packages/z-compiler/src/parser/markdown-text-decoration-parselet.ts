import {
    BacktickNode,
    DeltaNode,
    DoubleAsteriskNode,
    DoubleUnderscoreNode,
    Node,
    PlainTextNode,
} from '../ast';
import { Token } from '../z-tokenizer';
import { DeltaParselet } from './delta-parselet';
import { Parselet } from './parselet';

const WRAPPER_MARKERS = ['**', '__', '`'] as const;

// Handle wrapper tokens (**, __, `)
// Content inside is checked for delta patterns
// Note: Single underscore (_) is NOT supported as it conflicts with underscores in identifiers
export class MarkdownTextDecorationParselet extends Parselet {
    public parse(
        tokens: ReadonlyArray<Token>,
        i: number
    ): [Node, number] | undefined {
        if (!['**', '__', '`'].includes(tokens[i].tok)) return;

        const enclosing = tokens[i].tok;
        i++;

        // Collect inner content (without markers)
        let innerContent = '';
        while (i < tokens.length && tokens[i].tok !== enclosing) {
            innerContent += tokens[i].value;
            i++;
        }

        // Skip closing marker if found
        const hasClosingMarker = i < tokens.length;
        if (hasClosingMarker) {
            i++;
        }

        // If no closing marker, treat as plain text
        if (!hasClosingMarker) {
            return [new PlainTextNode(enclosing + innerContent), i];
        }

        // Check if inner content is a delta pattern (supports nested wrappers like __**↑4.48%**__)
        const deltaNode = this._parseNestedDeltaContent(innerContent);

        // If delta found at any nesting level, return just the delta node (wrappers stripped)
        if (deltaNode) {
            return [deltaNode, i];
        }

        // Non-delta content: create wrapper node with plain text child
        let wrapperNode: Node;
        const childNode = new PlainTextNode(innerContent);

        switch (enclosing) {
            case '**':
                wrapperNode = new DoubleAsteriskNode([childNode]);
                break;
            case '__':
                wrapperNode = new DoubleUnderscoreNode([childNode]);
                break;
            case '`':
                wrapperNode = new BacktickNode([childNode]);
                break;
            default:
                wrapperNode = new PlainTextNode(
                    enclosing + innerContent + enclosing
                );
        }

        return [wrapperNode, i];
    }

    /**
     * Recursively parses wrapped content to find nested delta patterns.
     * Handles cases like: __**↑4.48%**__ or `**-5%**`
     *
     * @returns DeltaNode if the innermost content is a delta pattern, null otherwise
     */
    private _parseNestedDeltaContent(content: string): DeltaNode | null {
        // First check if the content itself is a delta pattern
        const node = DeltaParselet.isExactDeltaPattern(content);
        if (node) {
            return node;
        }

        // Check if content is wrapped by another marker
        for (const marker of WRAPPER_MARKERS) {
            if (content.startsWith(marker) && content.endsWith(marker)) {
                const innerContent = content.slice(
                    marker.length,
                    -marker.length
                );
                if (innerContent.length > 0) {
                    // Recursively check the inner content
                    const nestedResult =
                        this._parseNestedDeltaContent(innerContent);
                    if (nestedResult) {
                        return nestedResult;
                    }
                }
            }
        }

        return null;
    }
}
