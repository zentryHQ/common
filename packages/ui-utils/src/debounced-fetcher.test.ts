import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebounceFetcher } from "./debounced-fetcher";

let rafCallbacks: Array<() => void> = [];

function flushRAF() {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb());
}

beforeEach(() => {
  rafCallbacks = [];

  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: () => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }),
  );
});

describe("DebounceFetcher", () => {
  it("resolves a single fetch call", async () => {
    const batchFn = vi.fn(async (args: number[]) => args.map((a) => a * 2));
    const fetcher = new DebounceFetcher(batchFn);

    const promise = fetcher.fetch(5);
    flushRAF();

    expect(await promise).toBe(10);
    expect(batchFn).toHaveBeenCalledWith([5]);
  });

  it("batches multiple fetch calls into a single batch call", async () => {
    const batchFn = vi.fn(async (args: number[]) => args.map((a) => a * 2));
    const fetcher = new DebounceFetcher(batchFn);

    const p1 = fetcher.fetch(1);
    const p2 = fetcher.fetch(2);
    const p3 = fetcher.fetch(3);
    flushRAF();

    expect(await p1).toBe(2);
    expect(await p2).toBe(4);
    expect(await p3).toBe(6);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("starts a new batch after the previous frame fires", async () => {
    const batchFn = vi.fn(async (args: string[]) =>
      args.map((a) => a.toUpperCase()),
    );
    const fetcher = new DebounceFetcher(batchFn);

    const p1 = fetcher.fetch("a");
    flushRAF();
    expect(await p1).toBe("A");

    const p2 = fetcher.fetch("b");
    flushRAF();
    expect(await p2).toBe("B");

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it("returns undefined for out-of-bounds results", async () => {
    const batchFn = vi.fn(async (_args: number[]) => [42]);
    const fetcher = new DebounceFetcher(batchFn);

    const p1 = fetcher.fetch(1);
    const p2 = fetcher.fetch(2);
    flushRAF();

    expect(await p1).toBe(42);
    expect(await p2).toBeUndefined();
  });

  it("does not schedule multiple rAFs for the same batch", async () => {
    const batchFn = vi.fn(async (args: number[]) => args);
    const fetcher = new DebounceFetcher(batchFn);

    fetcher.fetch(1);
    fetcher.fetch(2);
    fetcher.fetch(3);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
