const urlBase = 'http://localhost:8080'

async function enviarMensagem(origem, destino, texto) {
    const response = await fetch(`${urlBase}/mensagem`, {
        method: 'POST',
        body: JSON.stringify({ origem, destino, texto }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return response.ok
}

async function poll(usuario, handler) {
    while (true) {
        const response = await fetch(`${urlBase}/mensagens?usuario=${usuario}`, {
            headers: {
                'Cache-Control': 'no-cache',
            }
        })
        const text = await response.text()
        if (response.ok) {
            const mensagens = JSON.parse(text)
            handler(mensagens)
        } else {
            console.error('Erro no poll: ' + text)
        }
        // await new Promise(resolve => setTimeout(resolve, 200))
    }
}