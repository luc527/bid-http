import { Result, gerarTokenAleatorio } from "./common.js"

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

export type Leilao = {
  readonly codigo: number,
  readonly nomeDono: string,
  readonly nomeItem: string,
  readonly precoInicial: number,
  readonly anunciadoEm: Date,
  readonly lances: Lances,
  readonly finalizadoEm?: Date
}

export class Lances {
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

  todos(): Array<Readonly<Lance>> {
    return this.lances
  }
}

export default class Leiloes {
  #proximoCodigo:          number              = 1
  readonly #abertos:       Map<number, Leilao> = new Map()
  readonly #finalizados:   Map<number, Leilao> = new Map()
  readonly #tokens:        Map<number, string> = new Map()

  criar(dto: CriarLeilaoDTO): {codigo: number, token: string} {
    const codigo = this.#proximoCodigo++

    const leilao = {
      codigo,
      nomeDono: dto.nomeUsuario,
      nomeItem: dto.nomeItem,
      precoInicial: dto.precoInicial,
      anunciadoEm: new Date(),
      lances: new Lances(dto.precoInicial, codigo),
    } as Leilao

    this.#abertos.set(codigo, leilao)

    const token = gerarTokenAleatorio()
    this.#tokens.set(codigo, token)

    return {codigo, token}
  }

  find(codigo: number): Readonly<Leilao | undefined> {
    return this.#abertos.get(codigo)
        || this.#finalizados.get(codigo)
  }

  autenticar(codigo: number, token: string): boolean {
    return this.#tokens.has(codigo)
        && this.#tokens.get(codigo) == token
  }

  get abertos(): ReadonlyArray<Leilao> {
    return Array.from(this.#abertos.values())
  }

  get finalizados(): ReadonlyArray<Leilao> {
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

  realizarLance(codigoLeilao: number, nomeUsuario: string, preco: number): Result<Lance> {
    const leilao = this.find(codigoLeilao)
    if (!leilao) {
      return {ok: false, error: 'Leilão não encontrado'}
    }
    if (leilao.finalizadoEm) {
      return {ok: false, error: 'Leilão já foi finalizado'}
    }
    const lances = leilao.lances
    const lance = {nomeUsuario, preco, feitoEm: new Date()}
    const result = lances.adicionar(lance)
    if (result.ok) {
      return {ok: true, value: lance}
    } else {
      return result
    }
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