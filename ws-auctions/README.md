# Exemplo de WebSocket

O sistema de exemplo é um site para leilões

## Requisitos funcionais
- Anunciar um item, criando um _leilão_
- Participar do leilão de um item
- Fazerem _lances_ a um item
- Finalizar o leilão

## Regras de negócio
- O leilão só aceita lances enquanto tiver aberto
- Todo lance deve ser maior que o lance anterior
- Somente o usuário que criou o leilão pode finalizar o leilão

## Requisitos não funcionais
- Ao participar do leilão de um item, o usuário deve receber os lances em tempo real
- Os lances também devem ser transmitidos em tempo real
- Não precisa de armazenamento persistente, pode ficar tudo em memória
