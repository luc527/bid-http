import { Result, binSearch, gerarTokenAleatorio } from "./common.js"

export type CriarLeilaoDTO = {
  nomeUsuario: string,
  nomeItem: string,
  precoInicial: number,
}

type Lance = {
  nomeUsuario: string,
  preco: number,
  feitoEm: Date,
}

type Leilao = {
  codigo: number,
  nomeDono: string,
  nomeItem: string,
  precoInicial: number,
  anunciadoEm: Date,
  finalizado?: boolean,
}

type LeilaoFinalizado = Leilao & {
  finalizadoEm: Date,
  lanceGanhador: Lance | null,
}

export default class Leiloes {
  #proximoCodigo: number = 1
  #abertos: Array<Leilao> = []
  #finalizados: Array<LeilaoFinalizado> = []
  #tokens: Map<number, string> = new Map()

  criar(dto: CriarLeilaoDTO): {codigo: number, token: string} {
    const codigo = this.#proximoCodigo++

    const leilao = {
      codigo,
      nomeDono: dto.nomeUsuario,
      nomeItem: dto.nomeItem,
      precoInicial: dto.precoInicial,
      anunciadoEm: new Date()
    } as Leilao

    this.#abertos.push(leilao)

    const token = gerarTokenAleatorio()
    this.#tokens.set(codigo, token)

    return {codigo, token}
  }

  find(codigo: number): Result<Readonly<Leilao>> {
    const cmp = (leilao: Leilao) => codigo - leilao.codigo
    let value: Leilao | null = null

    if (value = binSearch(this.#abertos, cmp)) {
      value.finalizado = false
      return {ok: true, value}
    }
    else if (value = binSearch(this.#finalizados, cmp)) {
      value.finalizado = true
      return {ok: true, value}
    }
    else {
      return {ok: false, error: 'Leilão não encontrado'}
    }
  }

  validar(codigo: number, token: string): boolean {
    return this.#tokens.has(codigo)
        && this.#tokens.get(codigo) == token
  }

  get abertos(): ReadonlyArray<Leilao> {
    return this.#abertos
  }

  get finalizados(): ReadonlyArray<LeilaoFinalizado> {
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