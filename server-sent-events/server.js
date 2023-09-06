import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import * as g from './gerador.js'

const app = express()
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

function randomBetween(a, b) {
    return a + Math.random() * (b - a)
}

// ------------------------------

const idMap = new Map()

function proximoId(usuario) {
    if (!idMap.has(usuario)) {
        idMap.set(usuario, 1)
    }
    const id = idMap.get(usuario)
    idMap.set(usuario, id + 1)
    return id
}

app.get('/updates', async (req, res) => {
    try {
        const usuario = req.query.usuario
        if (!usuario) {
            res.status(400).send('Informe o usuário')
            return
        }

        res.header('Cache-Control', 'no-store')
        res.header('Content-Type', 'text/event-stream')

        while (!res.closed) {
            // No exemplo o id é um int mesmo, mas pode ser qualquer string
            const id = proximoId(usuario)  
            const [tipo, dados] = g.qualquer()
            res.write(`event: ${tipo}\n`)
            res.write(`data: ${JSON.stringify(dados, null, null)}\n`)
            res.write(`id: ${id}\n`)
            res.write('\n')

            const min = 100
            const max = 3000
            const t = Math.trunc(randomBetween(min, max))
            await new Promise(resolve => setTimeout(resolve, t))
        }
    } catch (err) {
        if (!res.closed)  {
            res.write('data: close\n')
            res.write('\n')
            res.end()
        }
    }

    // Fácil de esquecer os \n
    //
    // Vale a pena fazer um builder, tipo assim:
    // res.write(
    //   new StreamMessageBuilder()
    //     .event('comentario')
    //     .data('{"usuario": "abc123", "postagem": "dsjaiojs", ...}')
    //     .id(23)
    //     .build()
    // )
})

// ------------------------------

app.use(express.static('./static'))

app.use((req, res, next) => {
    res.status(404).end()
})

app.use((err, req, res, next) => {
    res.status(500).end()
    console.error(err)
})

const port = 8080
app.listen(port, () => {
    console.log(`Rodando em localhost:${port}`)
})