# Changelog

Todas as alteracoes notaveis do projeto NucleoIA V4 serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

---

## [Nao publicado]

### Adicionado
- Documentacao completa do projeto (8 arquivos em docs/)

---

## [4.0.0] - 2026-02-13

Lancamento completo da versao 4 do NucleoIA com reescrita total do sistema.

### Adicionado

#### Autenticacao e Seguranca
- Sistema de autenticacao JWT com access token (15min) e refresh token (7 dias)
- Login via Magic Link (link unico por email com expiracao de 15min)
- Fluxo de Primeiro Acesso para usuarios criados automaticamente via webhook
- Sistema TOTP (autenticador de codigos temporarios)
- Gestao de sessoes com heartbeat, listagem e encerramento remoto
- Cookies HttpOnly e Secure para protecao contra XSS
- Registro automatico de IPs e user-agents por sessao
- Rate limiting em endpoints criticos

#### Membros e Assinaturas
- Tres planos de assinatura: Mensal, Trimestral, Semestral
- Seis status de assinatura: Ativa, Inativa, Suspensa, Pendente, Expirada, Cancelada
- Painel administrativo completo para gestao de usuarios
- Busca e filtros avancados (por role, status, plano)
- Suspensao e reativacao de contas
- Alteracao manual de plano e status pelo admin
- Criacao automatica de usuarios via webhooks de pagamento
- Envio automatico de email de primeiro acesso

#### Sistema de Prompts
- Biblioteca completa de prompts de IA com categorias
- Dois tipos de prompt: Imagem e Video
- Sistema de curtidas (toggle like/unlike) com contagem
- Funcao de copia com contador e ActivityLog
- Prompts comunitarios (criados por membros)
- Secao "Meus Prompts" para gerenciamento pessoal
- Importacao em massa (bulk import) de ate 500 prompts por vez
- Download automatico de imagens externas para armazenamento local
- CRUD completo de categorias com slug automatico

#### Cursos e Aulas
- Hierarquia Curso > Modulos > Aulas
- Upload de videos (ate 3GB) e conteudo complementar em texto
- Progresso do aluno com marcacao de aula concluida
- Porcentagem de conclusao por curso
- Ordenacao customizavel em todos os niveis
- Publicacao/rascunho por curso

#### Ferramentas de IA
- Catalogo de ferramentas de IA com 7 categorias (Texto, Video, Imagem, Voz, Design, Edicao, Apresentacoes)
- Link direto, logo, descricao por ferramenta
- Ordenacao customizavel pelo admin
- Marcacao de destaque (featured)

#### Produtos Digitais
- Loja de produtos com 4 categorias (Curso, Ebook, Mentoria, Template)
- Preco, imagem, link de venda, descricao
- Produtos em destaque com endpoint dedicado
- CRUD completo pelo admin

#### Webhooks de Pagamento
- Integracao com Lastlink (ativacao, cancelamento, expiracao, renovacao)
- Integracao com Greenn (compra, cancelamento, reembolso)
- Validacao HMAC-SHA256 de autenticidade
- Criacao automatica de usuarios e assinaturas
- Mapeamento inteligente de planos

#### Webhooks de Saida
- Configuracao de webhooks para notificar sistemas externos
- Selecao de eventos por webhook
- Assinatura HMAC-SHA256 opcional
- Disparo fire-and-forget com timeout de 10s
- Auto-desativacao apos 10 falhas consecutivas
- Endpoint de teste

#### API Externa
- Endpoints publicos (prompts, categorias, produtos, cursos, estatisticas)
- Autenticacao via API Key (header X-API-Key ou query param)
- 4 tipos de chave: Producao, Teste, Importacao, Personalizada
- Contagem de uso e registro de ultimo acesso
- Revogacao de chaves

#### Dashboard e Perfil
- Dashboard do membro com visao geral e estatisticas pessoais
- Dashboard admin com metricas do sistema
- Pagina "Comece Aqui" (onboarding)
- Perfil com avatar, bio, telefone
- Preferencias (idioma, tema, notificacoes)
- Alteracao de senha com validacao
- Estatisticas pessoais (prompts copiados/curtidos, aulas concluidas)

#### Monitoramento
- Rastreamento de IP por sessao e usuario
- Deteccao de acesso multi-IP simultaneo
- Alertas de IP suspeito
- Logs de atividade com 10 tipos (LOGIN, LOGOUT, TWO_FA, PROMPT, COPY, LESSON, SUSPEND, ADMIN, SYSTEM, BACKUP)
- Monitoramento da VPS (CPU, memoria, disco, uptime)
- Health check endpoint

#### Backups
- Backup manual do PostgreSQL pelo admin
- Backup automatico com agendamento configuravel
- Compactacao gzip
- Retencao configuravel
- Historico de execucoes com status
- Script de restauracao

#### Internacionalizacao
- Suporte a 3 idiomas: Portugues (pt-BR), Ingles (en), Espanhol (es)
- Deteccao automatica do idioma do navegador
- Troca de idioma em tempo real
- Persistencia da preferencia

#### Configuracoes
- Configuracoes personalizaveis por pagina
- Credenciais compartilhadas (visiveis para membros, editaveis pelo Super Admin)
- Sistema de noticias internas com publicacao/rascunho
- Configuracao global do sistema de noticias

#### Infraestrutura
- Frontend React 18 + Vite + TailwindCSS + shadcn/ui
- Backend Express + Prisma + PostgreSQL 16
- 21 modelos e 11 enums no schema Prisma
- Nginx como proxy reverso com SSL Let's Encrypt
- PM2 em modo cluster (2 instancias)
- Upload de imagens (15MB), thumbnails (10MB), videos (3GB)
- Scripts de deploy, backup, rollback, health-check e restore
- Repositorio GitHub configurado

### Corrigido

#### Bug de Persistencia (Critico)
- **Problema**: Paginas do frontend usavam `useState` com dados hardcoded de arquivos locais (`@/data/products.ts`, `@/data/ai-tools.ts`). Todas as operacoes CRUD modificavam apenas o estado React, nunca chamavam a API. O backend estava totalmente funcional, mas nenhum dado era persistido.
- **Solucao**: Reescrita completa das paginas para usar hooks React Query de `@/hooks/useApi.ts` que chamam a API real.

#### Incompatibilidades de Tipo (Frontend vs Backend)
- Campo `imageUrl` no backend normalizado para `image` nos componentes frontend via funcoes helper
- Categorias UPPERCASE do backend (TEXT, VIDEO) mapeadas para display names no frontend
- IDs migrados de numerico para UUID (string) no frontend
- Precos Decimal do backend formatados corretamente como strings no frontend

### Seguranca
- HTTPS obrigatorio com redirect HTTP -> HTTPS
- Headers de seguranca via Helmet.js (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- CORS configurado exclusivamente para o dominio da aplicacao
- Senhas armazenadas com bcrypt
- JWT em cookies HttpOnly (protecao contra XSS)
- Trust proxy habilitado para capturar IP real via Nginx
- Validacao HMAC-SHA256 em todos os webhooks de entrada
- Rate limiting para prevenir abuso
- Monitoramento de IPs e deteccao de acessos suspeitos

---

## Convencoes deste Changelog

- `Adicionado` para novas funcionalidades
- `Alterado` para mudancas em funcionalidades existentes
- `Descontinuado` para funcionalidades que serao removidas em breve
- `Removido` para funcionalidades removidas
- `Corrigido` para correcoes de bugs
- `Seguranca` para correcoes de vulnerabilidades
