import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import Leiloes, {CriarLeilaoDTO} from './leiloes.js'

const app = express()

app.use(express.static('./public'))
app.use(bodyParser.json())

const gLeiloes = new Leiloes()

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
  if (typeof token == 'string' && gLeiloes.validar(codigo, token)) {
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
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port)
})