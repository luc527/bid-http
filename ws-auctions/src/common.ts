import { randomBytes } from "crypto"

export type Result<T=null> =
  | {ok: true, value?: T}
  | {ok: false, error: string}

export function gerarTokenAleatorio() {
  return randomBytes(64).toString('hex')
}

export function binIndex<T>(array: Array<T>, compare: (t: T) => number): number {
  let lo = 0
  let hi = array.length-1
  while (lo <= hi) {
    const mid = Math.floor(lo + (hi - lo) / 2)
    const cmp = compare(array[mid])
    if      (cmp < 0) hi = mid - 1
    else if (cmp > 0) lo = mid + 1
    else              return mid
  }
  return -1
}

export function binSearch<T>(array: Array<T>, compare: (t: T) => number): T | null {
  const i = binIndex(array, compare)
  return i < 0 ? null : array[i]
}
