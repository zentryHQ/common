import {
    BacktickNode,
    DeltaNode,
    DoubleAsteriskNode,
    DoubleUnderscoreNode,
    InlineWidgetNode,
    Node,
} from '../ast';
import { NodeReplacer } from './type';

/**
 * Replaces DeltaNode instances with InlineWidgetNode for styling (green/red).
 *
 * Handles:
 * - Direct DeltaNode → InlineWidgetNode
 * - Wrapper nodes (**, __, `) containing DeltaNode → InlineWidgetNode (wrapper is removed)
 * - Wrapper nodes containing non-DeltaNode → unchanged (escapes normally)
 *
 * Note: Single underscore (_) is NOT supported as it conflicts with underscores in identifiers
 */
export class DeltaValueNodeReplacer extends NodeReplacer {
    public override tryReplace(node: Node): [Node, number] | undefined {
        // Case 1: Direct DeltaNode
        if (node instanceof DeltaNode) {
            return [
                new InlineWidgetNode({
                    name: 'deltaValue',
                    leftOver: node.value.leftOver,
                    value: {
                        raw: node.value.raw,
                        direction: node.value.direction,
                    },
                }),
                0,
            ];
        }

        // Case 2: Wrapper nodes with potential DeltaNode child
        if (
            node instanceof DoubleAsteriskNode ||
            node instanceof DoubleUnderscoreNode ||
            node instanceof BacktickNode
        ) {
            // Check if the single child is a DeltaNode
            if (
                node.content.length === 1 &&
                node.content[0] instanceof DeltaNode
            ) {
                const deltaNode = node.content[0] as DeltaNode;
                return [
                    new InlineWidgetNode({
                        name: 'deltaValue',
                        leftOver: deltaNode.value.leftOver,
                        value: {
                            raw: deltaNode.value.raw,
                            direction: deltaNode.value.direction,
                        },
                    }),
                    0,
                ];
            }
            // Non-DeltaNode child: don't replace (escapes normally)
            return undefined;
        }

        return undefined;
    }
}
