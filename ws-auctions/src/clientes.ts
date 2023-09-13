// Cliente WebSocket

import { WebSocket } from "ws";
import Leiloes, { Lance, Leilao } from "./leiloes";
import { randomBytes } from "crypto";

type MensagemRecebidaLance     = { tipo: 'lance', leilao: number, usuario: string, lance: number }
type MensagemRecebidaFinalizar = { tipo: 'finalizar', leilao: number, token: string }
type MensagemRecebidaInscrever = { tipo: 'inscrever', leilao: number }

type MensagemRecebida =
  | MensagemRecebidaLance
  | MensagemRecebidaFinalizar
  | MensagemRecebidaInscrever

type Protocolo =
  | 'leilao.dono'
  | 'leilao.participante'

type MensagemEnviar =
  | { tipo: 'erro',              leilao: number, erro: string }
  | { tipo: 'erro-conexao',      erro: string }
  | { tipo: 'erro-interno' }
  | { tipo: 'lances-anteriores', leilao: number, lances: Array<Readonly<Lance>> }
  | MensagemBroadcast

type MensagemBroadcast =
  | { tipo: 'lance',      leilao: number, lance: Readonly<Lance> }
  | { tipo: 'finalizado', leilao: number, finalizadoEm: Date, lanceGanhador: Readonly<Lance | undefined> }


class MessageHandlingError extends Error {
}

const segundoMs = 1000

export class Clientes {
  leiloes: Leiloes
  clientes: Map<number, Set<Cliente>> = new Map()
  pingando: boolean = false

  constructor(leiloes: Leiloes) {
    this.leiloes = leiloes
  }

  ativar(ws: WebSocket): Cliente | undefined {
    return Cliente.criar(this, this.leiloes, ws)
  }

  inscrever(codigoLeilao: number, cli: Cliente): void {
    const leilao = this.leiloes.find(codigoLeilao)
    if (!leilao) {
      cli.enviar({
        tipo:   'erro',
        leilao: codigoLeilao,
        erro:   'Leilão não encontrado'
      })
      return
    }

    if (!this.clientes.has(codigoLeilao)) {
      this.clientes.set(codigoLeilao, new Set())
    }
    this.clientes.get(codigoLeilao)?.add(cli)

    const lances = leilao.lances
    cli.enviar({
      tipo:  'lances-anteriores',
      leilao: codigoLeilao,
      lances: lances.todos()
    })
    if (leilao.finalizadoEm) {
      cli.enviar({
        tipo: 'finalizado',
        leilao: codigoLeilao,
        finalizadoEm: leilao.finalizadoEm,
        lanceGanhador: lances.ultimo()
      })
    }
  }

  broadcast(msg: MensagemBroadcast) {
    for (const cli of this.clientes.get(msg.leilao) ?? []) {
      cli.enviar(msg)
    }
  }

  remover(cli: Cliente) {
    for (const clientes of this.clientes.values()) {
      clientes.delete(cli)
    }
  }

}


class Cliente {
  clientes:     Clientes
  leiloes:      Leiloes
  ws:           WebSocket
  protocolo:    Protocolo
  pingInterval: NodeJS.Timeout

  static criar(clientes: Clientes, leiloes: Leiloes, ws: WebSocket): Cliente | undefined {
    if (ws.protocol == 'leilao.dono' || ws.protocol == 'leilao.participante') {
      return new Cliente(clientes, leiloes, ws, ws.protocol)
    } else {
      ws.send(JSON.stringify({tipo: 'erro-conexao', erro: 'Protocolo inválido'}))
      ws.close()
      throw new Error('Protocolo inválido')
    }

  }

  constructor(clientes: Clientes, leiloes: Leiloes, ws: WebSocket, protocolo: Protocolo) {
    this.clientes  = clientes
    this.leiloes   = leiloes
    this.ws        = ws
    this.protocolo = protocolo

    ws.on('message', buf => {
      try {
        this.receber(this.parse(buf.toString()))
      } catch (error) {
        if (error instanceof MessageHandlingError) {
          this.enviar({tipo: 'erro-conexao', erro: `Erro: ${error.message}`})
        } else {
          this.enviar({tipo: 'erro-interno'})
        }
      }
    })

    this.pingInterval = setInterval(() => this.ping(), 60 * segundoMs)

    ws.on('close', () => {
      console.log('Conexão fechada')
      clearInterval(this.pingInterval)
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
    const result = this.leiloes.realizarLance(msg.leilao, msg.usuario, msg.lance)
    if (!result.ok) {
      throw new MessageHandlingError(result.error)
    }

    this.clientes.broadcast({
      tipo: 'lance',
      leilao: msg.leilao,
      lance: result.value as Lance
    })
  }

  receberFinalizar(msg: MensagemRecebidaFinalizar): void {
    if (this.protocolo != 'leilao.dono') {
      throw new MessageHandlingError('Somente o dono do leilão pode finalizar o leilão (protocolo incorreto)')
    }
    const result = this.leiloes.finalizar(msg.leilao, msg.token)
    if (!result.ok) {
      throw new MessageHandlingError(result.error)
    }
    const leilao = this.leiloes.find(msg.leilao) as Leilao
    const lanceGanhador = leilao.lances.ultimo()

    this.clientes.broadcast({
      tipo: 'finalizado',
      leilao: msg.leilao,
      lanceGanhador,
      finalizadoEm: leilao.finalizadoEm as Date
    })
  }

  receberInscrever(msg: MensagemRecebidaInscrever): void {
    this.clientes.inscrever(msg.leilao, this)
  }

  enviar(msg: MensagemEnviar): void {
    this.ws.send(JSON.stringify(msg))
  }

  ping() {
    const ws = this.ws
    if (ws.readyState != WebSocket.OPEN) {
      return
    }
    ws.ping()

    const id = randomBytes(8).toString('hex')
    console.log(id, 'ping')

    const timeout = setTimeout(() => {
      console.log(id, 'timeout')
      ws.close()
      this.clientes.remover(this)
      clearInterval(this.pingInterval)
    }, 30 * segundoMs)

    const callback = () => {
      console.log(id, 'pong')
      clearTimeout(timeout)
      ws.off('pong', callback)
    }
    ws.on('pong', callback)

  }
}