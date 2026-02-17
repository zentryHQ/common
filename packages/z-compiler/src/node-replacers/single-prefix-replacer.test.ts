import { describe, expect, test } from "vitest";
import { PlainTextNode } from "../ast";
import { SinglePrefixNodeReplacer } from "./single-prefix-replacer";

describe("Single prefix replacer", () => {
  test("Should not replace price patterns", () => {
    const replacer = new SinglePrefixNodeReplacer({
      "#": false,
      "%": false,
      "/": false,
      "@": false,
      $: true,
    });

    // act
    const result = replacer.tryReplace(new PlainTextNode("$10.18M"));

    expect(result).toBeUndefined();
  });
});
