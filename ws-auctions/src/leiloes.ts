import { Result, gerarTokenAleatorio } from "./common.js"

export type CriarLeilaoDTO = {
  nomeUsuario: string,
  nomeItem: string,
  precoInicial: number,
}

type Leilao = {
  codigo: number,
  token: string,
  nomeDono: string,
  nomeItem: string,
  precoInicial: number,
  anunciadoEm: Date,
  finalizadoEm?: Date | null,
}


let proxCodigo = 1

const leiloesAbertos:     Leilao[] = []
const leiloesFinalizados: Leilao[] = []

export function criar(dto: CriarLeilaoDTO): {codigo: number, token: string} {
  console.log('criar leilão', dto)

  const codigo = proxCodigo++
  const token = gerarTokenAleatorio()

  const leilao = {
    codigo,
    token,
    nomeDono: dto.nomeUsuario,
    nomeItem: dto.nomeItem,
    precoInicial: dto.precoInicial,
    anunciadoEm: new Date()
  } as Leilao

  console.log('leilão criado', leilao)

  leiloesAbertos.push(leilao)

  return {codigo, token}
}

export function abertos() {
  return structuredClone(leiloesAbertos)
}

export function parseLeilao(obj: any): Result<CriarLeilaoDTO> {
  console.log('parse leilão: ' + JSON.stringify(obj))

  const regexNome = /[a-zA-Z0-9_]+/
  if (!regexNome.test(obj?.nomeUsuario ?? '')) {
    return {ok: false, error: 'Nome de usuário inválido'}
  }
  const nomeUsuario = obj.nomeUsuario as string

  if ((obj?.nomeItem ?? '').length == 0) {
    return {ok: false, error: 'Nome de item inválido'}
  }
  const nomeItem = obj.nomeItem as string

  const precoInicial = Number(obj?.precoInicial ?? 0)
  if (Number.isNaN(precoInicial)) {
    return {ok: false, error: 'Preço inválido'}
  }
  if (precoInicial <= 0) {
    return {ok: false, error: 'Preço deve ser positivo'}
  }

  return {
    ok: true,
    value: {
      nomeUsuario,
      nomeItem,
      precoInicial,
    }
  }
}
