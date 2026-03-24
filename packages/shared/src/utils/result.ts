/**
 * Result monad for explicit error handling in service layer.
 * Services return Result<T, E> instead of throwing exceptions.
 * This makes error paths visible in type signatures and prevents
 * unhandled exceptions in business logic.
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Failure<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error instanceof Error ? result.error : new Error(String(result.error));
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
