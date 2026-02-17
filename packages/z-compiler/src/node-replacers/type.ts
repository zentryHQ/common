/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node } from '../ast';

export abstract class NodeReplacer {
    /**
     * Returns [the node to replace with, number of nodes to skip forward by, not counting self]
     */
    abstract tryReplace(
        node: Node,
        /**
         * The index `node` is in in the `nodes` array. Can be used for siblings context.
         */
        nodeIndex: number,
        nodes: ReadonlyArray<Node>
    ): [Node, number] | undefined;
}

export abstract class StatefulReplacer extends NodeReplacer {
    abstract reset(): void;
}
