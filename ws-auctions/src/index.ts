import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import Leiloes, { CriarLeilaoDTO } from './leiloes.js'
import { WebSocketServer } from 'ws'
import { Clientes } from './clientes.js'

const app = express()

app.use(express.static('./public'))
app.use(bodyParser.json())

const gLeiloes = new Leiloes()
const gClientes = new Clientes(gLeiloes)

// ------------------------------

app.post('/leilao', (req, res, next) => {
  try {
    const parsed = Leiloes.parse(req.body)
    if (!parsed.ok) {
      res.status(400).json({error: parsed.error})
    } else {
      const {codigo, token} = gLeiloes.criar(parsed.value as CriarLeilaoDTO)
      res.status(201).json({
        codigoLeilao: codigo,
        token
      })
    }
  } catch (err) {
    next(err)
  }
})

app.get('/leilao/abertos', (req, res) => {
  res.status(200).json(gLeiloes.abertos)
})

app.get('/leilao/:codigo/validar', (req, res) => {
  const codigo = Number(req.params.codigo)
  const token = req.query.token
  if (typeof token == 'string' && gLeiloes.autenticar(codigo, token)) {
    res.status(200).end()
  } else {
    res.status(401).end()
  }
})

app.get('/leilao/:codigo', (req, res) => {
  const codigo = Number(req.params.codigo)
  if (Number.isNaN(codigo)) {
    res.status(400).json({error: 'Código inválido'})
    return
  }
  const leilao = gLeiloes.find(codigo)
  if (leilao.ok) {
    res.status(200).json(leilao.value)
  } else {
    res.status(404).json({error: leilao.error})
  }
})

// ------------------------------

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({error:'Not Found'})
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({error:'Internal Error'})
  console.error(err)
})


const port = 8080
const server = app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port)
})

// WebSocket --------------------

const wss = new WebSocketServer({
  server,
  path: '/leilao/ws',
})
wss.on('error', error => {
  console.error(`websocket: error: ${error}`)
})

wss.on('connection', ws => {
  gClientes.ativar(ws)
})

/*
const protocol = ws.protocol
if (protocol == 'leilao.participante') {
  const {codigoLeilao, nomeUsuario} = await receberMensagem(ws)
  const rLeilao = gLeiloes.find(codigoLeilao)
  if (!rLeilao.ok) {
    ws.send(<erro: leilão não existe>)
    ws.close()
  } else {
    let fechar = false
    while (!fechar) {
      const preco = await receberPreco(ws)
    }
    ws.close()
  }
}
else if (protocol == 'leilao.dono') {

}

*/