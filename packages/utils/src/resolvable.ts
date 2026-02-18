export class Resolvable<T> {
  private _promise: Promise<T>;
  private _resolve!: (value: T) => void;
  private _reject!: (reason: any) => void;
  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  public resolve(value?: any) {
    this._resolve(value);
  }

  public reject(reason?: any) {
    this._reject(reason);
  }

  public wait() {
    return this._promise;
  }
}
