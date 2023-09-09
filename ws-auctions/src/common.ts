import { randomBytes } from "crypto"


export type Result<T> = {
  ok: boolean,
  value?: T,
  error?: string,
}

export function gerarTokenAleatorio() {
  return randomBytes(64).toString('hex')
}