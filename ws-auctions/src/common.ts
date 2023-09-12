import { randomBytes } from "crypto"

export type Result<T=null> =
  | {ok: true, value?: T}
  | {ok: false, error: string}

export function gerarTokenAleatorio() {
  return randomBytes(64).toString('hex')
}