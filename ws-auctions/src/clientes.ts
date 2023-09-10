// Cliente WebSocket

import { WebSocket } from "ws";
import Leiloes, { Lance } from "./leiloes";

type MensagemRecebidaLance = { tipo: 'lance', leilao: number, usuario: string, lance: number }
type MensagemRecebidaFinalizar = { tipo: 'finalizar', leilao: number, token: string }
type MensagemRecebidaInscrever = {tipo: 'inscrever', leilao: number}

type MensagemRecebida =
  | MensagemRecebidaLance
  | MensagemRecebidaFinalizar
  | MensagemRecebidaInscrever

type Protocolo =
  | 'leilao.dono'
  | 'leilao.participante'

type MensagemEnviar =
  | { tipo: 'erro', erro: string }
  | { tipo: 'erro-interno' }
  | { tipo: 'lance', lance: Readonly<Lance> }
  | { tipo: 'finalizado', leilao: number, lanceGanhador: Readonly<Lance | undefined> }


class MessageHandlingError extends Error {
}

export class Clientes {
  #leiloes: Leiloes
  #clientes: Map<number, Set<Cliente>> = new Map()

  // TODO ping periodico

  constructor(leiloes: Leiloes) {
    this.#leiloes = leiloes
  }

  ativar(ws: WebSocket) {
    new Cliente(this, this.#leiloes, ws)
  }

  inscrever(leilao: number, cli: Cliente): void {
    if (!this.#clientes.has(leilao)) {
      this.#clientes.set(leilao, new Set())
    }
    this.#clientes.get(leilao)?.add(cli)
  }

  broadcast(leilao: number, msg: MensagemEnviar) {
    for (const cli of this.#clientes.get(leilao) ?? []) {
      cli.enviar(msg)
    }
  }

  remover(cli: Cliente) {
    for (const clientes of this.#clientes.values()) {
      clientes.delete(cli)
    }
  }
}


class Cliente {
  clientes:  Clientes
  leiloes:   Leiloes
  ws:        WebSocket
  protocolo: Protocolo

  constructor(clientes: Clientes, leiloes: Leiloes, ws: WebSocket) {
    this.clientes = clientes
    this.leiloes = leiloes
    this.ws = ws

    if (ws.protocol == 'leilao.dono' || ws.protocol == 'leilao.participante') {
      this.protocolo = ws.protocol
    } else {
      this.enviar({tipo: 'erro', erro: 'Protocolo inválido'})
      ws.close()
      throw new Error('Protocolo inválido')
    }

    ws.on('message', buf => {
      try {
        const data = buf.toString()
        console.log(`Mensagem crua: ${data}`)
        const msg = this.parse(data)
        console.log('Mensagem parseada', msg)
        this.receber(msg)
      } catch (error) {
        if (error instanceof MessageHandlingError) {
          console.log('MessageHandlingError', error)
          this.enviar({tipo: 'erro', erro: `Mensagem inválida: ${error.message}`})
        } else {
          console.error(`Erro interno: ${error}`)
          this.enviar({tipo: 'erro-interno'})
        }
      }
    })

    ws.on('close', () => {
      console.log('Conexão fechada')
      this.clientes.remover(this)
    })
  }

  parse(data: string): MensagemRecebida {
    let json = null
    try {
      json = JSON.parse(data)
    } catch(cause) {
      throw new MessageHandlingError('JSON inválido', { cause })
    }

    if (!json.hasOwnProperty('tipo')) {
      throw new MessageHandlingError("Campo 'tipo' faltando")
    }
    const tipo = json.tipo
    if (tipo == 'lance') {
      return this.parseLance(json)
    } else if (tipo == 'finalizar') {
      return this.parseFinalizar(json)
    } else if (tipo == 'inscrever') {
      return this.parseInscrever(json)
    }
    throw new MessageHandlingError("Campo 'tipo' inválido")
  }

  parseCampoLeilao(data: any): number {
    if (!data.hasOwnProperty('leilao'))
      throw new MessageHandlingError("Campo 'leilao' faltando")
    const leilao = Number(data.leilao)
    if (Number.isNaN(leilao))
      throw new MessageHandlingError("Campo 'leilao' inválido")
    return leilao
  }

  parseLance(data: any): MensagemRecebidaLance {
    const leilao = this.parseCampoLeilao(data)
    if (!data.hasOwnProperty('lance'))
      throw new MessageHandlingError("Campo 'lance' faltando (tipo: 'lance')")
    const lance = Number(data.lance)
    if (Number.isNaN(lance) || lance <= 0)
      throw new MessageHandlingError("Campo 'lance' inválido (tipo: 'lance')")
    if (!data.hasOwnProperty('usuario'))
      throw new MessageHandlingError("Campo 'usuairo' faltando (tipo: 'lance')")
    const usuario = data.usuario
    return {tipo: 'lance', leilao, lance, usuario}
  }

  parseFinalizar(data: any): MensagemRecebidaFinalizar {
    const leilao = this.parseCampoLeilao(data)
    if (!data.hasOwnProperty('token'))
      throw new MessageHandlingError("Campo 'lance' faltando (tipo: 'lance')")
    const token = data.token as string
    return {tipo: 'finalizar', leilao, token}
  }

  parseInscrever(data: any): MensagemRecebidaInscrever {
    const leilao = this.parseCampoLeilao(data)
    return {tipo: 'inscrever', leilao}
  }

  receber(msg: MensagemRecebida): void {
    if (msg.tipo == 'lance') {
      this.receberLance(msg)
    } else if (msg.tipo == 'finalizar') {
      this.receberFinalizar(msg)
    } else if (msg.tipo == 'inscrever') {
      this.receberInscrever(msg)
    }
  }

  receberLance(msg: MensagemRecebidaLance): void {
    if (this.protocolo != 'leilao.participante') {
      throw new MessageHandlingError('Somente participantes do leilão podem enviar lances')
    }
    const lances = this.leiloes.lances(msg.leilao)
    if (lances == null) {
      throw new MessageHandlingError('Leilão não encontrado')
    }
    const lance = {nomeUsuario: msg.usuario, preco: msg.lance, feitoEm: new Date()}
    const resultAdicionar = lances.adicionar(lance)
    if (resultAdicionar.ok) {
      this.clientes.broadcast(msg.leilao, {tipo: 'lance', lance})
    } else {
      throw new MessageHandlingError(resultAdicionar.error)
    }
  }

  receberFinalizar(msg: MensagemRecebidaFinalizar): void {
    if (this.protocolo != 'leilao.dono') {
      throw new MessageHandlingError('Somente o dono do leilão pode finalizar o leilão (protocolo incorreto)')
    }
    const result = this.leiloes.finalizar(msg.leilao, msg.token)
    if (!result.ok) {
      throw new MessageHandlingError(result.error)
    }
    const lances = this.leiloes.lances(msg.leilao)
    const lanceGanhador = lances?.ultimo()
    this.clientes.broadcast(msg.leilao, {tipo: 'finalizado', leilao: msg.leilao, lanceGanhador})
  }

  receberInscrever(msg: MensagemRecebidaInscrever): void {
    this.clientes.inscrever(msg.leilao, this)
  }

  enviar(msg: MensagemEnviar): void {
    this.ws.send(JSON.stringify(msg))
  }
}