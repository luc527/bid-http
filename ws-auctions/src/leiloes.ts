import { Result, binIndex, binSearch, gerarTokenAleatorio } from "./common.js"

export type CriarLeilaoDTO = {
  nomeUsuario: string,
  nomeItem: string,
  precoInicial: number,
}

export type Lance = {
  readonly nomeUsuario: string,
  readonly preco: number,
  readonly feitoEm: Date,
}

type Leilao = {
  readonly codigo: number,
  readonly nomeDono: string,
  readonly nomeItem: string,
  readonly precoInicial: number,
  readonly anunciadoEm: Date,
  finalizado?: boolean,
}

type LeilaoFinalizado = Leilao & {
  readonly finalizadoEm: Date,
}

class Lances {
  readonly leilao:       number
  readonly precoInicial: number
  readonly lances:       Lance[]

  constructor(precoInicial: number, leilao: number) {
    this.leilao = leilao
    this.precoInicial = precoInicial
    this.lances = []
  }

  adicionar(lance: Lance): Result {
    const precoMaiorQue = this.lances.length == 0 ? this.precoInicial : this.lances.at(-1)?.preco ?? 0
    if (lance.preco > precoMaiorQue) {
      this.lances.push(lance)
      return {ok: true}
    } else {
      return {ok: false, error: 'Todo lance deve ser maior que o lance anterior'}
    }
  }

  ultimo(): Readonly<Lance | undefined> {
    return this.lances.at(-1)
  }
}

export default class Leiloes {
  #proximoCodigo: number = 1
  #abertos: Map<number, Leilao> = new Map()
  #finalizados: Map<number, LeilaoFinalizado> = new Map()
  #lances: Map<number, Lances> = new Map()
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

    this.#abertos.set(codigo, leilao)

    const token = gerarTokenAleatorio()
    this.#tokens.set(codigo, token)

    return {codigo, token}
  }

  find(codigo: number): Result<Readonly<Leilao>> {
    let value
    if (value = this.#abertos.get(codigo)) {
      value.finalizado = false
      return {ok: true, value}
    }
    else if (value = this.#finalizados.get(codigo)) {
      value.finalizado = true
      return {ok: true, value}
    }
    else {
      return {ok: false, error: 'Leilão não encontrado'}
    }
  }

  lances(codigo: number): Readonly<Lances | undefined> {
    return this.#lances.get(codigo)
  }

  autenticar(codigo: number, token: string): boolean {
    return this.#tokens.has(codigo)
        && this.#tokens.get(codigo) == token
  }

  get abertos(): ReadonlyArray<Leilao> {
    return Array.from(this.#abertos.values())
  }

  get finalizados(): ReadonlyArray<LeilaoFinalizado> {
    return Array.from(this.#finalizados.values())
  }

  finalizar(codigo: number, token: string): Result {
    const leilaoAberto = this.#abertos.get(codigo)
    if (leilaoAberto == null) {
      return {ok: false, error: 'Leilão não encontrado, ou já foi finalizado'}
    }
    if (!this.autenticar(codigo, token)) {
      return {ok: false, error: 'Somente o dono do leilão pode finalizá-lo'}
    }
    const leilaoFinalizado = {
      ...leilaoAberto,
      finalizadoEm: new Date(),
    }
    this.#abertos.delete(codigo)
    this.#finalizados.set(codigo, leilaoFinalizado)
    return {ok: true}
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