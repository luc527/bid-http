const _chave_alerta_storage = 'matchpoint-alerta-agendado';

{
    const json = sessionStorage.getItem(_chave_alerta_storage);
    if (json !== null) {
        try {
            const alerta = JSON.parse(json);
            console.log(json)
            Toast.fire(alerta);
        } catch (err) {
            console.error('Erro ao parsear JSON do alerta agendado');
        }
    }
    sessionStorage.removeItem(_chave_alerta_storage);
}

function agendarAlerta(alerta) {
    sessionStorage.setItem(_chave_alerta_storage, JSON.stringify(alerta));
}
