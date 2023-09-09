import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import * as leiloes from './leiloes.js'

const app = express()

app.use(express.static('./dist/public'))
app.use(bodyParser.json())

// ------------------------------

app.post('/leilao', (req, res, next) => {
  try {
    const {ok, error, value: maybeLeilao} = leiloes.parseLeilao(req.body)
    if (!ok) {
      res.status(400).json({error})
    } else {
      const leilao = maybeLeilao as leiloes.CriarLeilaoDTO
      const {codigo, token} = leiloes.criar(leilao)
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
  res.status(200).json(leiloes.abertos())
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