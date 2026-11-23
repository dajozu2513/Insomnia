/** An element whose index is known to be in range (throws if it is not). */
export function at<T>(list: ArrayLike<T>, index: number): T {
  const value = list[index];
  if (value === undefined) throw new RangeError(`Index ${String(index)} out of range`);
  return value;
}
