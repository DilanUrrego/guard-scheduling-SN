# Especificação — Clave Seguridad CTA · Programação de Turnos

> **Versão 0.3** (Aula 2 · 16/10) — alinhada ao código existente. Cada requisito mínimo do Projeto 2 corresponde a uma funcionalidade do domínio; o que já existe é reaproveitado e só se implementa o que falta.
> Documentos relacionados: `spec/design.md` (arquitetura) · `spec/tasks.md` (plano).
> Legenda: ✅ já existe no código · 🆕 a implementar no Projeto 2.

## 1. Domínio

**Vigilância privada.** A Clave Seguridad CTA coloca vigilantes em **postos de vigilância** dos seus **clientes**. Todo mês a área de programação decide **qual vigilante cobre qual posto, em qual turno e em qual dia**.

## 2. Problema

A programação era feita numa planilha Excel com macros:

1. Só uma pessoa edita por vez; os coordenadores não colaboram.
2. Não há detecção de conflitos: um vigilante pode ser escalado no dia de descanso ou em dois turnos sobrepostos.
3. Os documentos de suporte das novidades (incapacidades, licenças) chegam por WhatsApp/e-mail e ninguém sabe quais faltam.
4. O relatório de horas por cliente (base do faturamento) é montado à mão.

**Objetivo:** levar para a AWS a aplicação web que já centraliza cadastros e programação, e acrescentar o recebimento de suportes no S3, o registro automático com Lambda e o relatório de horas por cliente.

## 3. Personas

| Persona | Papel no sistema | Precisa de | Dor atual |
|---|---|---|---|
| **Administrador** | `admin` | Cadastrar clientes, postos e turnos; relatório de horas para faturar | Sem visão consolidada do serviço |
| **Coordenador de programação** | `coordinator` | Montar a escala mensal de ~80 vigilantes em ~25 postos e ver conflitos na hora | Dias corrigindo erros na planilha |
| **Recursos Humanos (RH/Folha)** | `coordinator` | Saber quais novidades estão sem documento | Cobra documento um a um |
| **Vigilante** | `viewer` | Consultar a própria escala | Recebe a escala por foto no WhatsApp |

## 4. Requisitos do domínio × requisitos mínimos

| Req. mínimo | Funcionalidade no domínio | Estado |
|---|---|---|
| **RF-01** CRUD de 2+ entidades relacionadas no RDS | Clientes 1:N Postos 1:N Tipos de turno; Vigilantes; Programação (N:N vigilante ↔ turno por data) com validação de descanso e cruces | ✅ código · 🆕 rodar no RDS |
| **RF-02** Upload com URL pré-assinada | Documento de suporte (JPG/PNG/PDF) ligado a uma **Novidade** | 🆕 |
| **RF-03** S3 → Lambda → RDS | Lambda registra o documento e marca `support_submitted = true` | 🆕 (o campo e o filtro de pendentes ✅ já existem) |
| **RF-04** Relatório em Lambda com JOIN/GROUP BY | Turnos e horas programadas por cliente e posto no mês | 🆕 |
| **RF-05** Front-end publicado | Angular publicado em S3 static website | ✅ código · 🆕 publicação |

## 5. Regras de negócio

| ID | Regra | Estado |
|---|---|---|
| RN-01 | Não se pode programar um vigilante numa data em que tem **descanso programado** (`rests`). | ✅ |
| RN-02 | Não se pode programar um vigilante em dois turnos cujos horários se sobrepõem no mesmo dia. | ✅ |
| RN-03 | Um turno que cruza a meia-noite (`crosses_midnight`) também conflita com turnos do **dia seguinte** (ex.: 17:00–05:00 no dia 10 × 04:00–12:00 no dia 11). | ✅ (Aula 3) |
| RN-04 | Uma novidade está com **suporte pendente** quando o seu tipo exige suporte (`support_required`) e ele ainda não foi entregue (`support_submitted = false`). | ✅ |
| RN-05 | São únicos: cédula do vigilante, NIT e código do cliente, código do posto e do tipo de turno. | ✅ |
| RN-06 | Clientes, postos e vigilantes não são apagados fisicamente: são **inativados** (`is_active = false`). | ✅ |
| RN-07 | Permissões por papel: `admin` tudo; `coordinator` programação, descansos e novidades; `viewer` apenas consulta a escala. | ✅ |

## 6. Histórias de usuário e critérios de aceite

### HU-01 — Gerenciar clientes e postos · RF-01 · Administrador ✅
Como administrador, quero cadastrar, editar, listar e inativar clientes e seus postos, para manter atualizado onde a empresa presta serviço.
- **Dado** um cliente novo, **quando** informo código, nome e NIT, **então** ele aparece na lista e continua lá após recarregar a página (persistido no RDS).
- **Dado** um NIT já cadastrado, **quando** tento salvar, **então** recebo HTTP 409.
- **Dado** um cliente, **quando** cadastro um posto ligado a ele, **então** o posto aparece filtrando por esse cliente.
- **Dado** um cliente, **quando** clico em excluir, **então** ele é inativado (RN-06).

### HU-02 — Configurar tipos de turno do posto · RF-01 · Administrador ✅
Como administrador, quero definir os turnos de cada posto (código, nome, hora início, hora fim, cor), para que o coordenador só escolha turnos válidos.
- **Dado** um posto, **quando** crio o turno "314" 17:00–05:00, **então** ele fica marcado como `crosses_midnight = true`.
- **Dado** um código de turno já existente, **quando** salvo, **então** recebo HTTP 409.

### HU-03 — Gerenciar vigilantes · RF-01 · Administrador / Coordenador ✅
Como administrador, quero cadastrar, editar, retirar e reativar vigilantes, para ter o pessoal disponível para a escala.
- **Dado** uma cédula já cadastrada, **quando** salvo outro vigilante com ela, **então** recebo HTTP 409.
- **Dado** um vigilante retirado (`terminate`), **quando** abro a programação, **então** ele não aparece para seleção.

### HU-04 — Programar turnos com validação · RF-01 · Coordenador ✅
Como coordenador de programação, quero atribuir um vigilante a um turno de um posto numa data, para montar a escala do mês.
- **Dado** que o vigilante tem descanso no dia 10, **quando** o programo no dia 10, **então** recebo HTTP 409 (RN-01). ✅
- **Dado** que o vigilante está no turno 05:00–17:00 do dia 10, **quando** o programo em 14:00–22:00 do dia 10, **então** recebo HTTP 409 "Cruce de turnos" (RN-02). ✅
- **Dado** que o vigilante está no turno 17:00–05:00 do dia 10, **quando** o programo em 04:00–12:00 do dia 11, **então** recebo HTTP 409 (RN-03). ✅
- **Dado** uma atribuição válida, **quando** salvo, **então** ela aparece no calendário com a cor do turno. ✅

### HU-05 — Programar descansos · RF-01 · Coordenador ✅
Como coordenador, quero registrar os dias de descanso de cada vigilante com antecedência, para que o sistema impeça escalá-lo nessas datas.
- **Dado** um descanso de 10 a 12, **quando** salvo, **então** os dias 10, 11 e 12 ficam bloqueados para esse vigilante (RN-01).

### HU-06 — Registrar novidades · RF-01 · Coordenador / RH ✅
Como RH, quero registrar novidades (incapacidades, permissões, férias, licenças…) e filtrar as que estão com suporte pendente, para cobrar só quem falta.
- **Dado** uma novidade de tipo "Incapacidad General" (exige suporte), **quando** salvo, **então** ela aparece no filtro "suporte pendente" (RN-04).
- **Dado** uma novidade com `support_submitted = true`, **quando** filtro pendentes, **então** ela não aparece.

### HU-07 — Enviar documento de suporte · RF-02 · Coordenador / RH 🆕
Como coordenador (com o documento entregue pelo vigilante), quero anexar a foto ou o PDF a uma novidade, para comprová-la.
- **Dado** uma novidade, **quando** escolho um arquivo, **então** o front chama `POST /api/novelties/:id/upload-url` e recebe uma URL pré-assinada válida por 5 minutos.
- **Então** o navegador faz `PUT` direto no S3 (o arquivo não passa pelo backend).
- **Dado** um arquivo que não é JPG/PNG/PDF ou que tem mais de 5 MB, **então** o backend responde HTTP 400 e não gera a URL.
- **Dado** uma URL usada depois de 5 minutos, **então** o S3 responde 403.

### HU-08 — Registrar o suporte automaticamente · RF-03 · RH 🆕
Como RH, quero que a novidade seja marcada como entregue assim que o arquivo chega ao S3, para não conferir manualmente.
- **Dado** um objeto criado em `supports/novelty-{id}/…`, **então** a Lambda `process-support` é disparada pelo evento do S3.
- **Então** ela insere uma linha em `support_documents` (chave S3, nome, tipo, tamanho) e marca a novidade com `support_submitted = true`.
- **Então** a execução aparece no CloudWatch Logs com o id da novidade.
- **Dado** uma chave fora do padrão ou uma novidade inexistente, **então** a Lambda registra o erro no log e não altera nada.
- **Dado** o mesmo evento recebido duas vezes, **então** não se cria documento duplicado (`s3_key` único).

### HU-09 — Relatório de horas por cliente · RF-04 · Administrador 🆕
Como administrador, quero ver, para um mês, o total de turnos e de horas programadas por cliente e posto, para faturar.
- **Dado** `GET /api/reports/hours-by-client?month=2026-10` com um JWT válido, **então** o API Gateway invoca a Lambda `report-hours-by-client`.
- **Então** a resposta lista cliente, posto, quantidade de turnos e horas, calculadas com `JOIN` + `GROUP BY` no RDS (turnos que cruzam a meia-noite contam certo: 17:00–05:00 = 12 h).
- **Dado** `month` ausente ou inválido, **então** recebo HTTP 400; sem token, HTTP 401.
- **Dado** um mês sem programação, **então** recebo lista vazia (HTTP 200).

### HU-10 — Usar o sistema pelo navegador · RF-05 · Todos ✅ / 🆕
Como usuário, quero entrar no sistema por uma URL pública e fazer login, para usar sem instalar nada.
- **Dado** a URL do S3 static website, **quando** abro no navegador, **então** carrega a tela de login do Angular.
- **Dado** credenciais válidas, **quando** faço login, **então** vejo o painel conforme o meu papel (RN-07).
- **Dado** uma nova sessão do Learner Lab, **quando** sigo o README, **então** o sistema volta a funcionar sem mudar código (RNF-03).

## 7. Requisitos não funcionais

| ID | Como atendemos |
|---|---|
| RNF-01 | RDS PostgreSQL em subnets privadas, sem acesso público; só aceita a porta 5432 dos SGs da EC2 e das Lambdas (`design.md` §6). |
| RNF-02 | `DATABASE_URL`, `JWT_SECRET` e `FRONTEND_URL` só em `.env` (ignorado pelo Git) e em variáveis de ambiente das Lambdas; o `docker-compose.yml` de desenvolvimento deixa de ter a senha escrita. |
| RNF-03 | O front usa a URL do API Gateway, que não muda entre sessões; o README tem o passo "nova sessão" (atualizar a integração com o novo IP da EC2). |
| RNF-04 | ADR-01: CRUD em container Docker na EC2; Lambdas só para RF-03 e RF-04. |
| RNF-05 | Recursos criados pelo console/CLI e documentados no README; nenhum IaC. |

## 8. Fora do escopo do Projeto 2

- Os 5 relatórios Excel existentes continuam no sistema, mas o relatório avaliado no RF-04 é o novo, em Lambda.
- Bloquear a programação por **novidade** (só o descanso bloqueia hoje).
- Dias ativos por tipo de turno (`active_days`) na validação, notificações e app móvel.
