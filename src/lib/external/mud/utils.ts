/**
 * Utility function to map a source object to an object with the same keys but mapped values
 *
 * @param source Source object to be mapped
 * @param valueMap Mapping values of the source object to values of the target object
 * @returns An object with the same keys as the source object but mapped values
 * @see [@]latticexyz/utils
 */
export function mapObject<S extends { [key: string]: unknown }, T extends { [key in keyof S]: unknown }>(
  source: S,
  valueMap: (value: S[keyof S], key: keyof S) => T[keyof S],
): T {
  const target: Partial<{ [key in keyof typeof source]: T[keyof S] }> = {};
  for (const key in source) {
    target[key] = valueMap(source[key], key);
  }
  return target as T;
}

export function transformIterator<A, B>(iterator: Iterator<A>, transform: (value: A) => B): IterableIterator<B> {
  return makeIterable({
    next() {
      const { done, value } = iterator.next();
      return { done, value: done ? value : transform(value) };
    },
  });
}

export function makeIterable<T>(iterator: Iterator<T>): IterableIterator<T> {
  const iterable: IterableIterator<T> = {
    ...iterator,
    [Symbol.iterator]() {
      return this;
    },
  };

  return iterable;
}
