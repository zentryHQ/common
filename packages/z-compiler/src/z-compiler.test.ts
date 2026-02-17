import { describe, expect, it } from "vitest";
import { AddressNodeReplacer } from "./node-replacers/address-replacer";
import { DeltaValueNodeReplacer } from "./node-replacers/delta-value-replacer";
import { SinglePrefixNodeReplacer } from "./node-replacers/single-prefix-replacer";
import { SourceLinkNodeReplacer } from "./node-replacers/source-link-replacer";
import { zCompiler } from "./z-compiler";

describe("zCompiler", () => {
  const compiler = new zCompiler({
    replacers: [
      new SourceLinkNodeReplacer(),
      new SinglePrefixNodeReplacer(),
      new AddressNodeReplacer(),
      new DeltaValueNodeReplacer(),
    ],
  });

  const makeAddressWidget = (tokenName: string, address: string) =>
    `<inline-widget>{"name": "tokenAddress", "props": {"value": {"tokenName":"${tokenName}","address":"${address}"}}}</inline-widget>`;

  describe("Core Functionality", () => {
    it("replaces source link correctly", () => {
      const text = `eiei [source](https://google.com)`;
      const output = compiler.compile(text);

      expect(output).toBe(
        `eiei <inline-widget>{"name": "sourceLink", "props": {"value": [{"title":"google.com","url":"https://google.com"}]}}</inline-widget>`,
      );
    });

    it("combines contiguous source links", () => {
      const text = `eiei [source](https://google.com), [source](https://google2.com), [source](https://google3.com)`;
      const output = compiler.compile(text);

      expect(output).toBe(
        `eiei <inline-widget>{"name": "sourceLink", "props": {"value": [{"title":"google.com","url":"https://google.com"},{"title":"google2.com","url":"https://google2.com"},{"title":"google3.com","url":"https://google3.com"}]}}</inline-widget>`,
      );
    });

    it("handles stateful source links across paragraphs", () => {
      const text = `Several emerging markets are grappling with severe economic instability. [source](https://google.com)

            For instance, Argentina\'s [rampant inflation](https://google.com) [source](https://google.com), with monthly rates reaching as high as 25.5% [source](https://google.com), has made many goods unobtainable.`;
      const output = compiler.compile(text);

      expect(output).toBe(
        `Several emerging markets are grappling with severe economic instability. <inline-widget>{"name": "sourceLink", "props": {"value": [{"title":"google.com","url":"https://google.com"}]}}</inline-widget>

            For instance, Argentina\'s [rampant inflation](https://google.com) <inline-widget>{"name": "sourceLink", "props": {"value": [{"title":"google.com","url":"https://google.com"}]}}</inline-widget>, with monthly rates reaching as high as 25.5% <inline-widget>{"name": "sourceLink", "props": {"value": [{"title":"google.com","url":"https://google.com"}]}}</inline-widget>, has made many goods unobtainable.`,
      );
    });

    it("wraps single prefixed token with correct component", () => {
      expect(compiler.compile("@john")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "john"}}</inline-widget>',
      );
    });

    it("wraps multiple prefixed tokens in a sentence", () => {
      expect(compiler.compile("hello @john #fun")).toBe(
        'hello <inline-widget>{"name": "userMention", "props": {"value": "john"}}</inline-widget> <inline-widget>{"name": "widgetMention", "props": {"value": "fun"}}</inline-widget>',
      );
    });

    it("ignores tokens without known prefix", () => {
      expect(compiler.compile("hello world")).toBe("hello world");
    });

    it("ignores unknown prefixes", () => {
      expect(compiler.compile("&oops test")).toBe("&oops test");
    });

    it("ignores tokens of length 1 (just prefix char)", () => {
      expect(compiler.compile("@ # $")).toBe("@ # $");
    });

    it("preserves multiple spaces between tokens", () => {
      expect(compiler.compile("hello   @john")).toBe(
        'hello   <inline-widget>{"name": "userMention", "props": {"value": "john"}}</inline-widget>',
      );
    });

    it("Should not match back-to-back tags (markdown syntax)", () => {
      expect(compiler.compile("## Something")).toBe("## Something");
    });

    it("handles empty input", () => {
      expect(compiler.compile("")).toBe("");
    });

    it("handles input with only spaces", () => {
      expect(compiler.compile("   ")).toBe("   ");
    });

    it("wraps alphanumeric value correctly", () => {
      expect(compiler.compile("meet @john123")).toBe(
        'meet <inline-widget>{"name": "userMention", "props": {"value": "john123"}}</inline-widget>',
      );
    });

    it("does not wrap prefix appearing in middle of word", () => {
      expect(compiler.compile("email john@example.com")).toBe(
        "email john@example.com",
      );
    });

    it("Should ignore paren in emoji!", () => {
      expect(compiler.compile(":( :) @jarindr :(")).toBe(
        ':( :) <inline-widget>{"name": "userMention", "props": {"value": "jarindr"}}</inline-widget> :(',
      );
    });

    it("Whatever leftover after prefix token is consumed", () => {
      expect(compiler.compile("hi @john!?")).toBe(
        'hi <inline-widget>{"name": "userMention", "props": {"value": "john"}}</inline-widget>!?',
      );
    });

    it("Should allow paren", () => {
      expect(compiler.compile(" (@jarindr) ")).toBe(
        ' (<inline-widget>{"name": "userMention", "props": {"value": "jarindr"}}</inline-widget>) ',
      );
    });

    it("Should ignore number only input", () => {
      expect(compiler.compile("$something $12.55 $12eiei $4,000 $1")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "something"}}</inline-widget> $12.55 <inline-widget>{"name": "projectMention", "props": {"value": "12eiei"}}</inline-widget> $4,000 $1',
      );
    });

    it("Should allow trailing dash", () => {
      expect(compiler.compile("eiei @my-widget eiei")).toBe(
        'eiei <inline-widget>{"name": "userMention", "props": {"value": "my-widget"}}</inline-widget> eiei',
      );
    });

    it("Should allow underscore in name", () => {
      expect(compiler.compile("eiei @my_widget eiei")).toBe(
        'eiei <inline-widget>{"name": "userMention", "props": {"value": "my_widget"}}</inline-widget> eiei',
      );
    });

    it("wraps @btc as userMention", () => {
      expect(compiler.compile("@btc")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("wraps $btc as projectMention", () => {
      expect(compiler.compile("$btc")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("wraps @btc in a sentence", () => {
      expect(compiler.compile("check out @btc today")).toBe(
        'check out <inline-widget>{"name": "userMention", "props": {"value": "btc"}}</inline-widget> today',
      );
    });

    it("wraps $btc in a sentence", () => {
      expect(compiler.compile("I like $btc and $eth")).toBe(
        'I like <inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget> and <inline-widget>{"name": "projectMention", "props": {"value": "eth"}}</inline-widget>',
      );
    });

    it("wraps uppercase $BTC as projectMention", () => {
      expect(compiler.compile("$BTC")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "BTC"}}</inline-widget>',
      );
    });

    it("converts **@btc** to userMention widget (strips bold)", () => {
      expect(compiler.compile("**@btc**")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("converts **$btc** to projectMention widget (strips bold)", () => {
      expect(compiler.compile("**$btc**")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("converts __@btc__ to userMention widget (strips underscore)", () => {
      expect(compiler.compile("__@btc__")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("converts __$btc__ to projectMention widget (strips underscore)", () => {
      expect(compiler.compile("__$btc__")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget>',
      );
    });

    it("converts **$btc** in a sentence to widget", () => {
      expect(compiler.compile("I like **$btc** today")).toBe(
        'I like <inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget> today',
      );
    });

    it("converts **@btc** in a sentence to widget", () => {
      expect(compiler.compile("follow **@btc** now")).toBe(
        'follow <inline-widget>{"name": "userMention", "props": {"value": "btc"}}</inline-widget> now',
      );
    });

    it("converts **$btc!** to projectMention with leftover", () => {
      expect(compiler.compile("**$btc!**")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget>!',
      );
    });

    it("converts **$RAIN (RAIN)** to projectMention with leftover", () => {
      expect(compiler.compile("**$RAIN (RAIN)**")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "RAIN"}}</inline-widget> (RAIN)',
      );
    });

    it("converts **@user (nickname)** to userMention with leftover", () => {
      expect(compiler.compile("**@user (nickname)**")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "user"}}</inline-widget> (nickname)',
      );
    });

    it("converts __$TOKEN (SYM)__ to projectMention with leftover", () => {
      expect(compiler.compile("__$TOKEN (SYM)__")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "TOKEN"}}</inline-widget> (SYM)',
      );
    });

    it("converts **#channel!** to widgetMention with leftover punctuation", () => {
      expect(compiler.compile("**#channel!**")).toBe(
        '<inline-widget>{"name": "widgetMention", "props": {"value": "channel"}}</inline-widget>!',
      );
    });

    it("converts __@user123 extra text__ to userMention with leftover", () => {
      expect(compiler.compile("__@user123 extra text__")).toBe(
        '<inline-widget>{"name": "userMention", "props": {"value": "user123"}}</inline-widget> extra text',
      );
    });

    it("converts **$btc?!** to projectMention with multiple punctuation leftover", () => {
      expect(compiler.compile("**$btc?!**")).toBe(
        '<inline-widget>{"name": "projectMention", "props": {"value": "btc"}}</inline-widget>?!',
      );
    });

    it("converts wrapped mention with leftover in sentence context", () => {
      expect(compiler.compile("Check out **$SOL (Solana)** today")).toBe(
        'Check out <inline-widget>{"name": "projectMention", "props": {"value": "SOL"}}</inline-widget> (Solana) today',
      );
    });

    it("keeps **`$btc`** as markdown (backticks escape even inside bold)", () => {
      expect(compiler.compile("**`$btc`**")).toBe("**`$btc`**");
    });

    it("keeps __`$btc`__ as markdown (backticks escape even inside underscore)", () => {
      expect(compiler.compile("__`$btc`__")).toBe("__`$btc`__");
    });
  });

  describe("Markdown / Escaping", () => {
    const makeDeltaWidget = (raw: string, direction: "positive" | "negative") =>
      `<inline-widget>{"name": "deltaValue", "props": {"value": {"raw":"${raw}","direction":"${direction}"}}}</inline-widget>`;

    // Non-delta, non-mention content inside wrappers should escape normally
    // Note: Single underscore (_) is NOT supported as it conflicts with underscores in identifiers
    // Note: Prefix mentions (@, $, #, /, %) inside wrappers are now converted to widgets
    it.each([
      ["**hello world**", "**hello world**"],
      ["__hello world__", "__hello world__"],
      ["`hello world`", "`hello world`"],
      ["**35%**", "**35%**"], // No prefix, not a delta
    ])(
      "Should escape non-delta content inside wrappers: %s",
      (input, expected) => {
        expect(compiler.compile(input)).toBe(expected);
      },
    );

    // Delta content inside wrappers should become widgets (wrapper removed)
    it.each([
      ["**+32%**", makeDeltaWidget("+32%", "positive")],
      ["**-5.5%**", makeDeltaWidget("-5.5%", "negative")],
      ["__+100M__", makeDeltaWidget("+100M", "positive")],
      ["__-$1.38B__", makeDeltaWidget("-$1.38B", "negative")],
      ["`+50%`", makeDeltaWidget("+50%", "positive")],
      ["`-100`", makeDeltaWidget("-100", "negative")],
      ["**↑4.48%**", makeDeltaWidget("↑4.48%", "positive")],
      ["**↓8.80%**", makeDeltaWidget("↓8.80%", "negative")],
    ])(
      "Should convert delta inside wrappers to widget: %s",
      (input, expected) => {
        expect(compiler.compile(input)).toBe(expected);
      },
    );

    // Nested wrappers with delta should strip all wrappers
    it.each([
      ["__**↑4.48%**__", makeDeltaWidget("↑4.48%", "positive")],
      ["`**↓8.80%**`", makeDeltaWidget("↓8.80%", "negative")],
      ["__`**↓8.80%**`__", makeDeltaWidget("↓8.80%", "negative")],
    ])(
      "Should convert nested delta inside wrappers to widget: %s",
      (input, expected) => {
        expect(compiler.compile(input)).toBe(expected);
      },
    );

    // Split delta patterns where prefix is outside wrapper
    it.each([
      ["↑**200%**", makeDeltaWidget("↑200%", "positive")],
      ["↓**8.80%**", makeDeltaWidget("↓8.80%", "negative")],
      ["+**50M**", makeDeltaWidget("+50M", "positive")],
      ["-**$1.38B**", makeDeltaWidget("-$1.38B", "negative")],
      [
        "fees ↑**200%** today",
        `fees ${makeDeltaWidget("↑200%", "positive")} today`,
      ],
    ])(
      "Should convert split delta with prefix outside wrapper: %s",
      (input, expected) => {
        expect(compiler.compile(input)).toBe(expected);
      },
    );

    // Mixed content in sentence
    it("Should handle mixed wrappers with delta and non-delta", () => {
      expect(compiler.compile("Price **+32%** but **volume** dropped")).toBe(
        `Price ${makeDeltaWidget("+32%", "positive")} but **volume** dropped`,
      );
    });

    // Backtick with non-delta should escape (code block behavior)
    it("Should escape non-delta inside backticks", () => {
      expect(compiler.compile("`$validButInsideBacktick`")).toBe(
        "`$validButInsideBacktick`",
      );
    });

    it("Should ignore contents inside backticks with surrounding text", () => {
      expect(
        compiler.compile(
          "hello2 `$validButInsideBacktick` #validOutsideBacktick",
        ),
      ).toBe(
        'hello2 `$validButInsideBacktick` <inline-widget>{"name": "widgetMention", "props": {"value": "validOutsideBacktick"}}</inline-widget>',
      );
    });

    it("Ignore content inside triple ticks", () => {
      const text = '```\nconst foo = "khongchai@nasa.com";\n```';
      expect(compiler.compile(text)).toBe(text);
    });

    // Unclosed wrappers should be treated as plain text
    it("Should handle unclosed wrapper as plain text", () => {
      expect(compiler.compile("**unclosed")).toBe("**unclosed");
      expect(compiler.compile("_unclosed")).toBe("_unclosed");
    });
  });

  describe("Address Parser", () => {
    it("parses Bitcoin legacy P2PKH address", () => {
      const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      expect(compiler.compile(address)).toBe(
        makeAddressWidget("bitcoin-legacy-p2pkh", address),
      );
    });

    it("parses Ronin address with prefix", () => {
      const address = "ronin:0x742d35Cc6634C0532925a3b8D4C9db96C4b4Df80";
      expect(compiler.compile(address)).toBe(
        makeAddressWidget("ronin", address),
      );
    });

    it("parses EVM address", () => {
      const address = "0x742d35cc6634c0532925a3b8d4c9db96c4b4df80";
      expect(compiler.compile(address)).toBe(makeAddressWidget("evm", address));
    });

    it("parses Solana address", () => {
      const address = "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj";
      expect(compiler.compile(address)).toBe(
        makeAddressWidget("solana", address),
      );
    });

    it("parses address alongside prefix mentions", () => {
      const address = "ronin:0x742d35Cc6634C0532925a3b8D4C9db96C4b4Df80";
      expect(compiler.compile(`@user sent to ${address}`)).toBe(
        `<inline-widget>{"name": "userMention", "props": {"value": "user"}}</inline-widget> sent to ${makeAddressWidget("ronin", address)}`,
      );
    });
  });

  describe("Delta Value Parser", () => {
    const makeDeltaWidget = (raw: string, direction: "positive" | "negative") =>
      `<inline-widget>{"name": "deltaValue", "props": {"value": {"raw":"${raw}","direction":"${direction}"}}}</inline-widget>`;

    // Basic positive patterns
    it("parses +5 as positive delta", () => {
      expect(compiler.compile("+5")).toBe(makeDeltaWidget("+5", "positive"));
    });

    it("parses ↑4.48% as positive delta", () => {
      expect(compiler.compile("↑4.48%")).toBe(
        makeDeltaWidget("↑4.48%", "positive"),
      );
    });

    it("parses +$220M as positive delta", () => {
      expect(compiler.compile("+$220M")).toBe(
        makeDeltaWidget("+$220M", "positive"),
      );
    });

    it("parses +60% as positive delta", () => {
      expect(compiler.compile("+60%")).toBe(
        makeDeltaWidget("+60%", "positive"),
      );
    });

    // Basic negative patterns
    it("parses -100 as negative delta", () => {
      expect(compiler.compile("-100")).toBe(
        makeDeltaWidget("-100", "negative"),
      );
    });

    it("parses ↓8.80% as negative delta", () => {
      expect(compiler.compile("↓8.80%")).toBe(
        makeDeltaWidget("↓8.80%", "negative"),
      );
    });

    it("parses -$1.38B as negative delta", () => {
      expect(compiler.compile("-$1.38B")).toBe(
        makeDeltaWidget("-$1.38B", "negative"),
      );
    });

    it("parses -8.8% as negative delta", () => {
      expect(compiler.compile("-8.8%")).toBe(
        makeDeltaWidget("-8.8%", "negative"),
      );
    });

    // Currency symbols
    it("parses +€50K as positive delta", () => {
      expect(compiler.compile("+€50K")).toBe(
        makeDeltaWidget("+€50K", "positive"),
      );
    });

    it("parses -£100M as negative delta", () => {
      expect(compiler.compile("-£100M")).toBe(
        makeDeltaWidget("-£100M", "negative"),
      );
    });

    it("parses +¥500 as positive delta", () => {
      expect(compiler.compile("+¥500")).toBe(
        makeDeltaWidget("+¥500", "positive"),
      );
    });

    // Numbers with commas (thousand separators)
    it("parses +1,234.56 as positive delta", () => {
      expect(compiler.compile("+1,234.56")).toBe(
        makeDeltaWidget("+1,234.56", "positive"),
      );
    });

    it("parses -$1,000,000 as negative delta", () => {
      expect(compiler.compile("-$1,000,000")).toBe(
        makeDeltaWidget("-$1,000,000", "negative"),
      );
    });

    // All suffix types
    it.each([
      ["+5%", "positive"],
      ["-10K", "negative"],
      ["+100M", "positive"],
      ["-50B", "negative"],
      ["+1T", "positive"],
      ["-5k", "negative"],
      ["+10m", "positive"],
      ["-100b", "negative"],
      ["+50t", "positive"],
    ] as const)("parses %s as %s delta", (input, direction) => {
      expect(compiler.compile(input)).toBe(makeDeltaWidget(input, direction));
    });

    // In context with other text
    it("parses delta value in a sentence", () => {
      expect(compiler.compile("The price changed by +5.5% today")).toBe(
        `The price changed by ${makeDeltaWidget("+5.5%", "positive")} today`,
      );
    });

    it("parses multiple delta values in text", () => {
      expect(compiler.compile("Revenue ↑4.48% but costs -$1.38B")).toBe(
        `Revenue ${makeDeltaWidget("↑4.48%", "positive")} but costs ${makeDeltaWidget("-$1.38B", "negative")}`,
      );
    });

    // Edge cases - should NOT match
    it("does not match standalone + or -", () => {
      expect(compiler.compile("+ -")).toBe("+ -");
    });

    it("does not match double prefix like ++5", () => {
      expect(compiler.compile("++5")).toBe("++5");
    });

    it("does not match double prefix like --100", () => {
      expect(compiler.compile("--100")).toBe("--100");
    });

    it("does not match prefix without number", () => {
      expect(compiler.compile("+$")).toBe("+$");
    });

    it("does not match prefix followed by non-digit", () => {
      expect(compiler.compile("+abc")).toBe("+abc");
    });

    // Leftover handling
    it("preserves leftover text after delta value", () => {
      expect(compiler.compile("+5!")).toBe(
        `${makeDeltaWidget("+5", "positive")}!`,
      );
    });

    it("preserves leftover text with suffix", () => {
      expect(compiler.compile("+5%.")).toBe(
        `${makeDeltaWidget("+5%", "positive")}.`,
      );
    });

    // Integration with other replacers
    it("works alongside user mentions", () => {
      expect(compiler.compile("@user gained +50%")).toBe(
        `<inline-widget>{"name": "userMention", "props": {"value": "user"}}</inline-widget> gained ${makeDeltaWidget("+50%", "positive")}`,
      );
    });

    it("works alongside project mentions", () => {
      expect(compiler.compile("$BTC is ↑4.48%")).toBe(
        `<inline-widget>{"name": "projectMention", "props": {"value": "BTC"}}</inline-widget> is ${makeDeltaWidget("↑4.48%", "positive")}`,
      );
    });

    // Natural language patterns (up/down)
    it('parses "up 5%" as positive delta', () => {
      expect(compiler.compile("up 5%")).toBe(
        makeDeltaWidget("up 5%", "positive"),
      );
    });

    it('parses "down 10%" as negative delta', () => {
      expect(compiler.compile("down 10%")).toBe(
        makeDeltaWidget("down 10%", "negative"),
      );
    });

    it('parses "Up 5.5%" (case-insensitive) as positive delta', () => {
      expect(compiler.compile("Up 5.5%")).toBe(
        makeDeltaWidget("Up 5.5%", "positive"),
      );
    });

    it('does NOT match "down5%" (requires space)', () => {
      expect(compiler.compile("down5%")).toBe("down5%");
    });

    it('does NOT match "up 10B" (requires percent)', () => {
      expect(compiler.compile("up 10B")).toBe("up 10B");
    });

    it('parses wrapped "**up 5%**" correctly (strips wrappers)', () => {
      expect(compiler.compile("**up 5%**")).toBe(
        makeDeltaWidget("up 5%", "positive"),
      );
    });

    it('does NOT match "up $5"', () => {
      expect(compiler.compile("up $5")).toBe("up $5");
    });

    it('does not match "upper 5%"', () => {
      expect(compiler.compile("upper 5%")).toBe("upper 5%");
    });

    it("handles leftover after word prefix: up 5%!", () => {
      expect(compiler.compile("up 5%!")).toBe(
        `${makeDeltaWidget("up 5%", "positive")}!`,
      );
    });
  });
});
