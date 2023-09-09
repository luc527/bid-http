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

export default class Leiloes {
  #proximoCodigo: number = 1
  #abertos: Array<Leilao> = []
  #finalizados: Array<Leilao> = []

  criar(dto: CriarLeilaoDTO): {codigo: number, token: string} {
    const codigo = this.#proximoCodigo++
    const token = gerarTokenAleatorio()

    const leilao = {
      codigo,
      token,
      nomeDono: dto.nomeUsuario,
      nomeItem: dto.nomeItem,
      precoInicial: dto.precoInicial,
      anunciadoEm: new Date()
    } as Leilao

    this.#abertos.push(leilao)

    return {codigo, token}
  }

  get abertos(): ReadonlyArray<Leilao> {
    return this.#abertos
  }

  get finalizados(): ReadonlyArray<Leilao> {
    return this.#finalizados
  }

  static parse(obj: any): Result<CriarLeilaoDTO> {
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
}