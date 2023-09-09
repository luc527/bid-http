# Exemplo de WebSocket

O sistema de exemplo é um site para leilões

## REQUISITOS FUNCIONAIS
- Permitir anunciar um _item_
- Permitir se inscrever em _tags_ para receber notificações itens anunciados de seu interesse
- Permitir participar do leilão de um item
- Permitir usuários fazerem _lances_
- Permitir criador do leilão finalizar o leilão

## REQUISITOS NÃO FUNCIONAIS
- As notificações de itens anunciados devem ser recebidas em tempo real
- Ao participar do leilão de um item, o usuário deve receber os lances em tempo real
- Os lances também devem ser transmitidos em tempo real
- Não precisa de armazenamento persistente, pode ficar tudo em memória

## REGRAS
- Todo lance deve ser maior que o lance anterior

## DEFINIÇÕES
```typescript
Item = {
  id:              int,
  nome:            string,
  precoInicial:    float,
  tags:            string[],
  anunciadoEm:     Date,
  historicoLances: Lance[]
  melhorLance:     ?Lance,
}

Lance = {
  comprador: string,
  preco:     float,
}
```

