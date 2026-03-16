import { ResultAsync, type Result } from "neverthrow";

export function result_async_from_promise<T, E>(promise: Promise<Result<T, E>> | (() => Promise<Result<T, E>>)): ResultAsync<T, E> {
  return ResultAsync.fromPromise(
    (async () => {
      let result: Result<T, E>;
      if (typeof promise === "function") {
        result = await promise();
      } else {
        result = await promise;
      }
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    })(),
    (e) => e as E
  );
}
