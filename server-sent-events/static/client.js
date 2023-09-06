const templateItem = document.querySelector('#tmpl-item-feed')
const containerItens = document.querySelector('main')

// TODO checkbox para acompanhar ou não os eventos

const iconeReacao = {
    'curtir': 'bi-hand-thumbs-up',
    'amei':   'bi-heart',
    'haha':   'bi-emoji-laughing',
    'uau':    'bi-emoji-dizzy',
    'triste': 'bi-emoji-frown',
    'grr':    'bi-emoji-angry'
}

function criarItem(icone, htmlTexto) {
    const item = templateItem.content.firstElementChild.cloneNode(true)
    item.querySelector('.icone').classList.add(icone)
    item.querySelector('.texto').innerHTML = htmlTexto
    return item
}

function adicionarItem(icone, htmlTexto) {
    containerItens.append(criarItem(icone, htmlTexto))
    scroll({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
    })
}


function conectarEventSource(usuario) {
    const es = new EventSource(`/updates?usuario=${usuario}`)

    es.onopen = () => {
        console.log('EventSource iniciada')
    }

    es.onerror = ev => {
        console.error('Erro EventSource', ev)
    }

    es.onmessage = ev => {
        if (ev.data == 'close') {
            es.close()
        }
    }

    es.addEventListener('reacao', ev => {
        const {usuario, reacao, postagem} = JSON.parse(ev.data)
        const icone = iconeReacao[reacao]
        const html = `O usuário <b>${usuario}</b> reagiu com <b>${reacao}</b> à sua postagem <i>"${postagem}"</i>`
        adicionarItem(icone, html)
    })

    es.addEventListener('comentario', ev => {
        const {usuario, postagem, comentario} = JSON.parse(ev.data)
        const icone = 'bi-chat-left-fill'
        const html = `O usuário <b>${usuario}</b> comentou <i>"${comentario}"</i> na sua postagem <i>"${postagem}"</i>`
        adicionarItem(icone, html)
    })

    es.addEventListener('recomendacao', ev => {
        const {pagina} = JSON.parse(ev.data)
        const icone = 'bi-stars'
        const html = `Recomandos a página <b>${pagina}</b>`
        adicionarItem(icone, html)
    })

    es.addEventListener('postagem-contato', ev => {
        const {usuario, postagem} = JSON.parse(ev.data)
        const icone = 'bi-file-post'
        const html = `Seu amigo(a) <b>${usuario}</b> postou <i>"${postagem}"</i>`
        adicionarItem(icone, html)
    })

    es.addEventListener('postagem-pagina', ev => {
        const {pagina, postagem} = JSON.parse(ev.data)
        const icone = 'bi-file-post-fill'
        const html = `A página <b>${pagina}</b> postou <i>"${postagem}"</i>`
        adicionarItem(icone, html)
    })
}