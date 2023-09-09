const gHost = `http://localhost:8080`

const gFormatReais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const _displayOriginal = new WeakMap()

function chaveTokenLeilao(codigoLeilao) {
  return `token-leilao-${codigoLeilao}`
}

function qs(s, e=null) {
  return (e ?? document).querySelector(s)
}

// Só faz sentido chamar se foi feito um hide() antes
function show(e) {
  if (_displayOriginal.has(e)) {
    e.style.display = _displayOriginal.get(e)
  }
}

function hide(e) {
  _displayOriginal.set(e, getComputedStyle(e).getPropertyValue('display'))
  e.style.setProperty('display', 'none', 'important')
}

function toggle(e, b) {
  if (b) show(e)
  else hide(e)
}