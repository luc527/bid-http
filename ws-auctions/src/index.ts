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

// ------------------------------

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send('Not Found')
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send('Internal Error')
  console.error(err)
})

const port = 8080
app.listen(port, () => {
  console.log('Servidor rodando na porta ' + port)
})