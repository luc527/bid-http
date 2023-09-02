import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'

const app = express()
app.use(bodyParser.json())
app.use(morgan('dev'))

//------------------------------

/**
 * @var Map<string, Response>
 * Objetos Response que o servidor está mantendo abertos até uma mensagem chegar
 */
const responsesAguardandoMensagem = new Map()

/**
 * @var Map<string, Array<Mensagem>>
 * Mensagens que o servidor está salvando até o destinatário pedir por elas
 */
const mensagensAguardandoPoll = new Map()

app.get('/mensagens', (req, res, next) => {
    try {
        const destino = req.query.usuario
        const mensagens = mensagensAguardandoPoll.get(destino);
        if (mensagens && mensagens.length > 0) {
            res.json(mensagens).end()
            mensagensAguardandoPoll.delete(destino)
        } else {
            responsesAguardandoMensagem.set(destino, res)
        }

        dbg()
    } catch (err) {
        next(err)
    }
})

app.post('/mensagem', (req, res, next) => {
    try {
        const origem  = req.body.origem
        const destino = req.body.destino
        const texto   = req.body.texto

        const mensagem = {origem, texto, data: new Date()}

        let recebida = false

        const resDestino = responsesAguardandoMensagem.get(destino)
        if (resDestino) {
            if (!resDestino.closed) {
                resDestino.json([mensagem]).end()
                recebida = true
            }
            responsesAguardandoMensagem.delete(destino)
        }

        if (!recebida) {
            if (!mensagensAguardandoPoll.has(destino)) {
                mensagensAguardandoPoll.set(destino, [])
            }
            mensagensAguardandoPoll.get(destino).push(mensagem)
        }

        dbg()

        res.end()
    } catch (err) {
        next(err)
    }
})

function dbg() {
    console.log({
        aguardandoMensagem: Array.from(responsesAguardandoMensagem.keys()),
        mensagensAguardandoPoll,
    })
}

app.use(express.static('./static'))

//------------------------------

app.use((req, res, next) => {
    res.status(404).end()
})

app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).end()
})

const port = 8080
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
})