/**
 * Debounces a fetchable function into a single call.
 */
export class DebounceFetcher<ARGS, RES> {
  private _aggregated: Array<{
    resolvable: {
      promise: Promise<RES | null>;
      resolve(r: RES): void;
    };
    args: ARGS;
  }> = [];
  private _rafId: number | null = null;

  public constructor(
    private _batchableFetch: (batchedArgs: ARGS[]) => Promise<RES[]>,
  ) {}

  public fetch(args: ARGS): Promise<RES | null> {
    let resolve: (r: RES) => void = () => {};
    const promise = new Promise<RES | null>((r) => {
      resolve = r;
    });
    this._aggregated.push({
      resolvable: {
        promise,
        resolve,
      },
      args,
    });

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        const aggregated = [...this._aggregated];
        this._aggregated = [];
        this._rafId = null;

        const doThing = async () => {
          // fetch here with all arguments and return
          const allPayloads = aggregated.map((a) => a.args);
          const result = await this._batchableFetch(allPayloads);
          for (let i = 0; i < aggregated.length; i++) {
            aggregated[i].resolvable.resolve(result[i]);
          }
        };

        void doThing();
      });
    }

    return promise;
  }
}
