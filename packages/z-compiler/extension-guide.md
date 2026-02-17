# zCompiler Extension Guide (AI Optimized)

This guide is designed for AI agents to programmatically extend the `zCompiler`. It follows a dual-architecture: **Structure (Parselets)** and **Semantics (Replacers)**.

## 1. Architectural Decision Matrix

| Requirement     | Use a **Parselet**                           | Use a **Replacer**                             |
| :-------------- | :------------------------------------------- | :--------------------------------------------- |
| **Logic Type**  | Structural / Grammatical                     | Pattern Matching / Semantic                    |
| **Input**       | `Token[]` stream                             | `Node[]` AST                                   |
| **Identifiers** | Explicit symbols (e.g. `[ ]`, `**`, `{{ }}`) | Implicit patterns (e.g. Regex, specific words) |
| **Nesting**     | Required (handles recursion)                 | Not required (processed on flat nodes)         |
| **Pass**        | Pass 1: Parsing                              | Pass 2: Transformation                         |

---

## 2. Implementation Workflow (Agent Instructions)

### Step 1: Define the AST Node

Add a new node class in `ast.ts`

- Terminal elements: Extend `TerminalNode<T>`.
- Wrapping elements: Extend `NonTerminalNode`.
- Mandatory: Implement `print()`.

```typescript
export class NewFeatureNode extends TerminalNode<string> {
    public override print(): string {
        return `<inline-widget>{"name": "newFeature", "props": {"value": "${this.value}"}}</inline-widget>`;
    }
}
```

### Step 2: Choose Extension Point

#### Option A: Tokenizer Update (Optional)

If your feature requires new single/multi-character symbols, add them to `SPECIAL_TOKENS` in `z-tokenizer.ts`

#### Option B: Creating a Parselet (Structural)

1. Create a file in `parser/`.
2. Implement Parselet (parselet.ts) interface.
3. **Critical**: Always return `[Node, nextIndex]`.
4. Register in `z-parser.ts`.

#### Option C: Creating a Replacer (Semantic)

1. Create a file in `node-replacers/`.
2. Implement NodeReplacer
3. **Skip Counter**: Return `[Node, skipCount]` where `skipCount` is the number of _additional_ nodes to skip.
4. If the state must reset per compilation (e.g., counters), use `StatefulReplacer`.
5. Register in the `zCompiler` constructor options.

---

## 3. Best Practices for AI Agents

### 1. The "Skip" Safety

When implementing `tryReplace` in a Replacer, if you consume sibling nodes (e.g. merging two nodes), you must accurately return the `skip` count.

- `0` means only the current node is replaced.
- `1` means the current node and the next node are consumed.

### 2. Regex Boundaries

Replacer regexes should usually be tested against the `PlainTextNode.value`. Always check for whitespace boundaries if the pattern shouldn't trigger mid-word.

### 3. Preserving "Leftovers"

If your parser/replacer matches a prefix but leaves some characters behind (e.g., matching `@user!` but the `!` isn't part of the name), ensure the "leftover" is either included in the node or yielded back as a `PlainTextNode` to avoid data loss.

### 4. Test Attribution

New extensions **must** include a test case in z-compiler.test.ts
Test categories:

- Basic match.
- Negative match (should NOT trigger).
- Conflict with existing markdown (e.g. inside backticks).
- Edge cases (empty string, weird characters).

---

## 4. Troubleshooting for Humans

- **Infinite Loop**: Usually caused by a Parselet returning the same index `i` instead of `i + consumed`.
- **Vanishing Content**: Check if a Replacer is returning a `skip` count that is too high.
- **Double Decoding**: Ensure a Parselet isn't accidentally outputting raw text that a Replacer then tries to parse again.
