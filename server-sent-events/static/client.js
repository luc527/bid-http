const templateItem = document.querySelector('#tmpl-item-feed')
const containerItens = document.querySelector('main')

const iconeReacao = {
    'curtir': 'bi-hand-thumbs-up',
    'amei':   'bi-heart',
    'haha':   'bi-emoji-laughing',
    'uau':    'bi-emoji-dizzy',
    'triste': 'bi-emoji-frown',
    'grr':    'bi-emoji-angry'
}

function formatarData(data) {
    const pad2 = s => String(s).padStart(2, '0')
    const pad4 = s => String(s).padStart(4, '0')

    const d = pad2(data.getDay())
    const m = pad2(data.getMonth())
    const y = pad4(data.getFullYear())
    const h = pad2(data.getHours())
    const i = pad2(data.getMinutes())
    const s = pad2(data.getSeconds())

    return `${d}/${m}/${y} ${h}:${i}:${s}`
}

function criarItem(icone, htmlTexto, data, cor=null) {
    const item = templateItem.content.firstElementChild.cloneNode(true)
    item.querySelector('.icone').classList.add(icone)
    item.querySelector('.texto').innerHTML = htmlTexto
    item.querySelector('.data').innerText = formatarData(data)
    if (cor == 'amarelo') {
        {
            const e = item.querySelector('.bg-primary-subtle')
            const cl = e.classList
            cl.remove('bg-primary-subtle')
            cl.add('bg-warning-subtle')
        }
        {
            const e = item.querySelector('.text-primary')
            const cl = e.classList
            cl.remove('text-primary')
            cl.add('text-warning')
        }
    }
    return item
}

function adicionarItem(icone, htmlTexto, data, cor=null) {
    containerItens.append(criarItem(icone, htmlTexto, data, cor))
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
        const {usuario, reacao, postagem, data} = JSON.parse(ev.data)
        const icone = iconeReacao[reacao]
        const html = `O usuário <b>${usuario}</b> reagiu com <b>${reacao}</b> à sua postagem <i>"${postagem}"</i>`
        adicionarItem(icone, html, new Date(data), 'amarelo')
    })

    es.addEventListener('comentario', ev => {
        const {usuario, postagem, comentario, data} = JSON.parse(ev.data)
        const icone = 'bi-chat-left-fill'
        const html = `O usuário <b>${usuario}</b> comentou <i>"${comentario}"</i> na sua postagem <i>"${postagem}"</i>`
        adicionarItem(icone, html, new Date(data))
    })

    es.addEventListener('recomendacao', ev => {
        const {pagina, data} = JSON.parse(ev.data)
        const icone = 'bi-stars'
        const html = `Recomandos a página <b>${pagina}</b>`
        adicionarItem(icone, html, new Date(data))
    })

    es.addEventListener('postagem-contato', ev => {
        const {usuario, postagem, data} = JSON.parse(ev.data)
        const icone = 'bi-file-post'
        const html = `Seu amigo(a) <b>${usuario}</b> postou <i>"${postagem}"</i>`
        adicionarItem(icone, html, new Date(data))
    })

    es.addEventListener('postagem-pagina', ev => {
        const {pagina, postagem, data} = JSON.parse(ev.data)
        const icone = 'bi-file-post-fill'
        const html = `A página <b>${pagina}</b> postou <i>"${postagem}"</i>`
        adicionarItem(icone, html, new Date(data))
    })
}