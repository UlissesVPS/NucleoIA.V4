# Webhooks - NucleoIA V4

---

## Visao Geral

O sistema possui dois tipos de webhook:

1. **Webhooks de saida (customizaveis):** Disparam para URLs externas quando eventos internos ocorrem
2. **Webhooks de entrada (Lastlink/Greenn):** Recebem notificacoes de plataformas de pagamento

---

## Webhooks de Saida (Sistema Customizavel)

### Como funciona

```
Evento interno (ex: user.created)
  --> webhook.service.ts (fireWebhookEvent)
    --> Busca webhooks ativos para o evento no banco
    --> Para cada webhook:
      --> Gera assinatura HMAC-SHA256 do body
      --> POST para URL configurada (timeout 10s)
      --> Sucesso: reset failures, atualiza lastFired
      --> Falha: incrementa failures
      --> 10+ falhas: auto-desativa (status = ERROR)
```

### Payload enviado

```json
{
  "event": "nome.do.evento",
  "timestamp": "2026-02-13T16:00:00.000Z",
  "data": { ... }
}
```

### Headers enviados

| Header | Valor |
|--------|-------|
| Content-Type | application/json |
| X-Webhook-Secret | Secret do webhook |
| X-Webhook-Signature | sha256={hmac_hex} |
| User-Agent | NucleoIA-Webhook/1.0 |
| + Headers customizados | Configurados por webhook |

### Verificando assinatura (receptor)

```javascript
const crypto = require('crypto');

function verifySignature(body, secret, signatureHeader) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return signatureHeader === expected;
}
```

### Endpoints de gestao (Super Admin)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /api/system/webhooks | Listar webhooks |
| POST | /api/system/webhooks | Criar webhook |
| PUT | /api/system/webhooks/:id | Atualizar |
| DELETE | /api/system/webhooks/:id | Deletar |
| POST | /api/system/webhooks/:id/test | Testar (envia payload de teste) |

### Campos do webhook

```json
{
  "name": "Meu Webhook",
  "url": "https://example.com/webhook",
  "event": "user.created",
  "secret": "meu-secret-seguro",
  "status": "ACTIVE",
  "headers": { "X-Custom": "valor" }
}
```

### Status possiveis

| Status | Descricao |
|--------|-----------|
| ACTIVE | Recebendo eventos normalmente |
| PAUSED | Pausado manualmente |
| ERROR | Auto-desativado apos 10+ falhas consecutivas |

---

## Webhooks de Entrada - Lastlink

### Endpoint
`POST /api/webhooks/lastlink` (sem autenticacao)

### Eventos suportados

#### subscription.created
Ativa a assinatura do usuario.

```json
{
  "event": "subscription.created",
  "data": {
    "client_email": "user@email.com",
    "client_name": "Nome",
    "plan_name": "mensal",
    "subscription_id": "12345"
  }
}
```

Acao:
1. Busca usuario pelo email
2. Se nao existe: cria com senha temporaria + is_active = true
3. Se existe: ativa e atualiza subscription
4. Mapeia plan_name para Plan enum (MENSAL, TRIMESTRAL, SEMESTRAL)
5. Calcula expires_at baseado no plano

#### subscription.canceled
Desativa a assinatura.

```json
{
  "event": "subscription.canceled",
  "data": {
    "client_email": "user@email.com"
  }
}
```

Acao: Define subscription.status = CANCELED, user.is_active = false

---

## Webhooks de Entrada - Greenn

### Endpoint
`POST /api/webhooks/green` (sem autenticacao)

### Eventos suportados

#### subscription.created
```json
{
  "event": "subscription.created",
  "data": {
    "client": {
      "email": "user@email.com",
      "name": "Nome",
      "id": "greenn_id"
    },
    "plan": {
      "name": "mensal"
    },
    "subscription": {
      "id": "sub_123"
    }
  }
}
```

Acao: Similar ao Lastlink - cria/ativa usuario + subscription.

#### subscription.canceled
Desativa a assinatura do usuario.

---

## Mapeamento de Planos

| Nome do plano (webhook) | Plan enum |
|--------------------------|-----------|
| mensal, monthly, 1 | MENSAL |
| trimestral, quarterly, 3 | TRIMESTRAL |
| semestral, biannual, semi, 6 | SEMESTRAL |

### Duracao por plano

| Plan | Duracao |
|------|---------|
| MENSAL | 30 dias |
| TRIMESTRAL | 90 dias |
| SEMESTRAL | 180 dias |

---

## Testando Webhooks

### Testar webhook de saida (via admin)
```bash
curl -X POST https://painel.nucleoia.online/api/system/webhooks/{id}/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Testar webhook Lastlink (simular)
```bash
curl -X POST https://painel.nucleoia.online/api/webhooks/lastlink \
  -H "Content-Type: application/json" \
  -d '{
    "event": "subscription.created",
    "data": {
      "client_email": "teste@email.com",
      "client_name": "Teste",
      "plan_name": "mensal",
      "subscription_id": "test_123"
    }
  }'
```

### Testar webhook Greenn (simular)
```bash
curl -X POST https://painel.nucleoia.online/api/webhooks/green \
  -H "Content-Type: application/json" \
  -d '{
    "event": "subscription.created",
    "data": {
      "client": {
        "email": "teste@email.com",
        "name": "Teste",
        "id": "greenn_test"
      },
      "plan": { "name": "mensal" },
      "subscription": { "id": "sub_test" }
    }
  }'
```
