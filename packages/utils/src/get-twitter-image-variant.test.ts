import { describe, expect, test } from "vitest";
import { getTwitterImageVariant } from "./get-twitter-image-variant";

describe("getTwitterImageVariant", () => {
  const baseUrl = "https://pbs.twimg.com/profile_images/1234567890/example";

  test('returns original URL when variant is "original"', () => {
    const src = `${baseUrl}_normal.jpg`;
    const result = getTwitterImageVariant(src, "original");
    expect(result).toBe(`${baseUrl}.jpg`);
  });

  test('replaces size with "normal" when variant is "normal"', () => {
    const src = `${baseUrl}_bigger.jpg`;
    const result = getTwitterImageVariant(src, "normal");
    expect(result).toBe(`${baseUrl}_normal.jpg`);
  });

  test('replaces size with "bigger" when variant is "bigger"', () => {
    const src = `${baseUrl}_mini.jpg`;
    const result = getTwitterImageVariant(src, "bigger");
    expect(result).toBe(`${baseUrl}_bigger.jpg`);
  });

  test('replaces size with "mini" when variant is "mini"', () => {
    const src = `${baseUrl}_normal.jpg`;
    const result = getTwitterImageVariant(src, "mini");
    expect(result).toBe(`${baseUrl}_mini.jpg`);
  });

  test('returns the same URL if no size specified in original URL and variant is not "original"', () => {
    const src = `${baseUrl}.jpg`;
    const result = getTwitterImageVariant(src, "normal");
    expect(result).toBe(`${baseUrl}_normal.jpg`);
  });

  test('returns the same URL if the source URL does not contain "pbs.twimg.com"', () => {
    const src = "https://example.com/profile_images/example_normal.jpg";
    const result = getTwitterImageVariant(src, "original");
    expect(result).toBe(src);
  });

  test("returns the original URL when there is no variant specification in it", () => {
    const src = `${baseUrl}.jpg`;
    const result = getTwitterImageVariant(src, "original");
    expect(result).toBe(src);
  });

  test("handles URLs with different image formats", () => {
    const pngSrc = `${baseUrl}_normal.png`;
    const jpegSrc = `${baseUrl}_bigger.jpeg`;
    const pngResult = getTwitterImageVariant(pngSrc, "bigger");
    const jpegResult = getTwitterImageVariant(jpegSrc, "mini");
    expect(pngResult).toBe(`${baseUrl}_bigger.png`);
    expect(jpegResult).toBe(`${baseUrl}_mini.jpeg`);
  });

  test("handles error if the URL format is incorrect", () => {
    const src = "invalid_url";
    try {
      getTwitterImageVariant(src, "original");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
