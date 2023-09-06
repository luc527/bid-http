import {fakerPT_BR as faker} from '@faker-js/faker'

function usuario() {
    return faker.internet.displayName()
}

function postagem() {
    return faker.lorem.words()
}

function comentario() {
    return faker.lorem.sentence()
}

function reacao() {
    const reacoes = ['curtir', 'amei', 'haha', 'uau', 'triste', 'grr']
    const r = Math.floor(Math.random() * reacoes.length)
    return reacoes[r]
}

function pagina() {
    return [
        faker.word.sample(),
        faker.word.adjective(),
        faker.word.noun(),
        faker.word.preposition(),
        faker.word.noun()
    ].join(' ')
}

export function qualquer() {
    const a = [
        reacaoPostagem,
        comentarioPostagem,
        recomendacaoPagina,
        postagemPagina,
        postagemContato,
    ]
    const r = Math.floor(Math.random() * a.length)
    const [tipo, dados] = a[r]()
    dados.data = new Date()
    return [tipo, dados]
}

export function reacaoPostagem() {
    return ['reacao', {
        usuario: usuario(),
        reacao: reacao(),
        postagem: postagem(),
    }]
}

export function comentarioPostagem() {
    return ['comentario', {
        usuario: usuario(),
        comentario: comentario(),
        postagem: postagem(),
    }]
}

export function recomendacaoPagina() {
    return ['recomendacao', {
        pagina: pagina(),
    }]
}

export function postagemPagina() {
    return ['postagem-pagina', {
        pagina: pagina(),
        postagem: postagem(),
    }]
}

export function postagemContato() {
    return ['postagem-contato', {
        usuario: usuario(),
        postagem: postagem(),
    }]
}