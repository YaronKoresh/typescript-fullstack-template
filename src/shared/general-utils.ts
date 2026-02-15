export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export const sleep = (seconds: number): CancelablePromise<void> => {
  let timer: NodeJS.Timeout;
  let rejectFn: (reason?: any) => void;

  const promise: CancelablePromise<void> = new Promise<void>(
    (
      resolve: (value: void | PromiseLike<void>) => void,
      reject: (reason?: any) => void,
    ): void => {
      rejectFn = reject;
      timer = setTimeout(resolve, seconds * 1000);
    },
  ) as CancelablePromise<void>;

  promise.cancel = (): void => {
    clearTimeout(timer);
    rejectFn(new Error("Sleep cancelled"));
  };

  return promise;
};
