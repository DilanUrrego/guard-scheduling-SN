# Especificação — Clave Seguridad CTA · Programação de Turnos

> **Versão 0.2** (Aula 2 · 16/10) — escopo reduzido para que **cada requisito funcional do domínio corresponda 1:1 a um requisito mínimo do Projeto 2**. Histórias com critérios de aceite completos.
> Documentos relacionados: `specs/design.md` (arquitetura) · `specs/tasks.md` (plano).

## 1. Domínio

**Vigilância privada.** A Clave Seguridad CTA coloca vigilantes em **postos de vigilância** de seus **clientes**. Todo mês a área de programação decide **qual vigilante cobre qual posto, em qual turno e em qual dia**.

## 2. Problema

A programação é feita numa planilha Excel com macros:

1. Só uma pessoa edita por vez; os coordenadores não colaboram.
2. Não há detecção de conflitos: um vigilante pode ser escalado no dia de descanso ou em dois turnos sobrepostos.
3. Os documentos de suporte das novidades (atestados, licenças) chegam por WhatsApp/e-mail e ninguém sabe quais faltam.
4. O relatório de horas por cliente (base do faturamento) é montado à mão.

**Objetivo:** uma aplicação web publicada na AWS que centraliza cadastros e programação, valida conflitos, recebe os documentos de suporte no S3 e gera o relatório por cliente a partir do banco.

## 3. Personas

| Persona | Quem é | Precisa de | Dor atual |
|---|---|---|---|
| **Coordenador de programação** | Monta a escala de ~80 vigilantes em ~25 postos | Atribuir turnos e ver conflitos na hora | Dias corrigindo erros na planilha |
| **Administrador** | Gerente de operações | Cadastrar clientes, postos e turnos; relatório para faturar | Sem visão consolidada |
| **Vigilante** | Trabalha em turnos de 12 h | Enviar o atestado sem ir ao escritório | Manda foto pelo WhatsApp e se perde |
| **Recursos Humanos (RH/Folha)** | Calcula pagamentos e descontos | Saber quais novidades estão sem documento | Cobra documento um a um |

## 4. Decisão de escopo: requisitos do domínio = requisitos mínimos

O sistema original tem muitos módulos (5 relatórios Excel, papéis, calendário, descansos, novidades…). Para **não trabalhar em dobro**, cada requisito mínimo vira **uma** funcionalidade do domínio, e o que não contribui para nenhum requisito fica fora (seção 8).

| Req. mínimo | Requisito funcional do domínio | Por que é útil para o negócio |
|---|---|---|
| RF-01 CRUD de 2+ entidades relacionadas no RDS | **Cadastros e programação**: Cliente 1:N Posto 1:N TipoTurno; Vigilante; Programação (N:N vigilante ↔ tipo de turno, por data) com validação de conflitos | É o núcleo que substitui a planilha |
| RF-02 Upload com URL pré-assinada | **Documento de suporte** (JPG/PNG/PDF) ligado a uma **Novidade** | Acaba com atestados perdidos no WhatsApp |
| RF-03 S3 → Lambda → RDS | Lambda **registra o documento** no RDS e marca a novidade como `ENTREGADO` | O RH vê na hora o que falta, sem conferir manualmente |
| RF-04 Relatório em Lambda com JOIN/GROUP BY | **Turnos e horas programadas por cliente e posto no mês** | Base do faturamento |
| RF-05 Front-end publicado | **Angular** publicado em **S3 static website** | Todos acessam pelo navegador |

**Simplificação importante:** o "descanso programado" vira **um tipo de Novidade** (`DESCANSO`). Uma única tabela e uma única tela atendem descansos, incapacidades, férias e licenças, e a validação de conflitos consulta só essa tabela.

## 5. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Não se pode programar um vigilante numa data coberta por uma novidade dele (`DESCANSO`, `INCAPACIDAD`, `VACACIONES`, `LICENCIA`, `SUSPENSION`). |
| RN-02 | Não se pode programar um vigilante em dois turnos cujos horários se sobrepõem (considerando turnos que cruzam a meia-noite). |
| RN-03 | Um turno cruza a meia-noite quando `hora_fim <= hora_inicio` (ex.: 18:00–06:00 = 12 h). |
| RN-04 | Novidades de tipo `INCAPACIDAD` e `LICENCIA` exigem suporte e nascem com `estado_soporte = PENDIENTE`; as demais nascem `NO_REQUIERE`. |
| RN-05 | Documento do vigilante é único; NIT do cliente é único. |
| RN-06 | Cliente, posto ou vigilante com programações não é apagado fisicamente: é **inativado** (`ativo = false`). |

## 6. Histórias de usuário e critérios de aceite

### HU-01 — Gerenciar clientes e postos · RF-01 · Administrador
Como administrador, quero cadastrar, editar, listar e inativar clientes e seus postos, para manter atualizado onde a empresa presta serviço.
- **Dado** um cliente novo, **quando** informo nome e NIT, **então** ele aparece na lista e continua lá após recarregar a página.
- **Dado** um NIT já cadastrado, **quando** tento salvar, **então** recebo o erro "NIT já cadastrado" (HTTP 409).
- **Dado** um cliente, **quando** cadastro um posto com nome e endereço, **então** o posto aparece na lista de postos daquele cliente.
- **Dado** um posto com programações, **quando** peço para excluí-lo, **então** ele é inativado e some das listas de seleção.

### HU-02 — Configurar tipos de turno do posto · RF-01 · Administrador
Como administrador, quero definir os turnos de cada posto (nome, hora início, hora fim, cor), para que o coordenador só escolha turnos válidos.
- **Dado** um posto, **quando** crio "Noturno" 18:00–06:00, **então** o sistema mostra duração de 12 h (RN-03).
- **Dado** um turno sem nome ou sem horários, **quando** salvo, **então** recebo erro de validação (HTTP 400).

### HU-03 — Gerenciar vigilantes · RF-01 · Administrador
Como administrador, quero cadastrar e editar vigilantes (documento, nome, telefone, supervisor ou base), para ter o pessoal disponível para a escala.
- **Dado** um documento já existente, **quando** salvo outro vigilante com ele, **então** recebo "Documento já cadastrado" (HTTP 409).
- **Dado** um vigilante inativado, **quando** abro a tela de programação, **então** ele não aparece para seleção.

### HU-04 — Programar turnos com validação · RF-01 · Coordenador
Como coordenador de programação, quero atribuir um vigilante a um turno de um posto numa data, para montar a escala do mês.
- **Dado** que o vigilante tem `DESCANSO` no dia 10, **quando** o programo no dia 10, **então** recebo "Vigilante com novidade nesta data" (HTTP 409, RN-01).
- **Dado** que o vigilante está no turno 06:00–18:00 do dia 10, **quando** o programo em 14:00–22:00 do dia 10, **então** recebo "Conflito de horário" (HTTP 409, RN-02).
- **Dado** que o vigilante está no turno 18:00–06:00 do dia 10, **quando** o programo em 05:00–13:00 do dia 11, **então** também há conflito (RN-03).
- **Dado** uma atribuição válida, **quando** salvo, **então** ela aparece na grade do mês filtrável por cliente e por vigilante.

### HU-05 — Registrar novidades (inclusive descansos) · RF-01 · Coordenador / RH
Como coordenador de programação, quero registrar novidades de um vigilante com tipo e período, para bloquear essas datas e informar o RH.
- **Dado** uma novidade `INCAPACIDAD`, **quando** salvo, **então** ela fica com estado de suporte `PENDIENTE` (RN-04).
- **Dado** uma novidade `DESCANSO`, **quando** salvo, **então** fica `NO_REQUIERE`.
- **Dado** `fecha_fim < fecha_inicio`, **quando** salvo, **então** recebo erro de validação (HTTP 400).
- **Dado** o filtro "pendentes", **quando** listo, **então** vejo só novidades com estado `PENDIENTE`.

### HU-06 — Enviar documento de suporte · RF-02 · Vigilante / RH
Como vigilante (ou RH em nome dele), quero anexar foto ou PDF do atestado a uma novidade, para comprová-la.
- **Dado** uma novidade, **quando** escolho um arquivo, **então** o front chama `POST /api/novedades/{id}/upload-url` e recebe uma URL pré-assinada válida por 5 minutos.
- **Então** o navegador faz `PUT` do arquivo **direto no S3** (o arquivo não passa pelo backend).
- **Dado** um arquivo que não é JPG/PNG/PDF ou que tem mais de 5 MB, **então** o backend recusa gerar a URL (HTTP 400).
- **Dado** uma URL usada após 5 minutos, **então** o S3 responde 403.

### HU-07 — Registrar o suporte automaticamente · RF-03 · RH
Como Recursos Humanos, quero que a novidade seja marcada como entregue assim que o arquivo chega ao S3, para não conferir manualmente.
- **Dado** um objeto criado em `soportes/novedad-{id}/…`, **então** a Lambda `procesa-soporte` é disparada pelo evento do S3.
- **Então** ela grava em `documento` (chave S3, nome, tipo, tamanho, data) e muda a novidade para `ENTREGADO`.
- **Então** a execução aparece no CloudWatch Logs com o id da novidade.
- **Dado** uma chave fora do padrão ou novidade inexistente, **então** a Lambda registra o erro no log e não altera nada.
- **Dado** o mesmo evento recebido duas vezes, **então** não se cria documento duplicado (chave S3 única).

### HU-08 — Relatório de programação por cliente · RF-04 · Administrador
Como administrador, quero ver, para um mês, o total de turnos e de horas por cliente e por posto, para faturar.
- **Dado** `GET /relatorios/programacion-por-cliente?mes=2026-10`, **então** o API Gateway invoca a Lambda `relatorio-programacion`.
- **Então** a resposta lista cliente, posto, quantidade de turnos e horas, calculada com `JOIN` + `GROUP BY` no RDS.
- **Dado** `mes` ausente ou inválido, **então** recebo HTTP 400.
- **Dado** um mês sem programação, **então** recebo lista vazia (HTTP 200).

### HU-09 — Usar o sistema pelo navegador · RF-05 · todos
Como usuário, quero acessar o sistema por uma URL pública, para usar sem instalar nada.
- **Dado** a URL do S3 static website, **quando** abro no navegador, **então** carrega o Angular e as telas consomem a API pelo API Gateway.
- **Dado** uma nova sessão do Learner Lab, **quando** sigo o README, **então** o front volta a funcionar só trocando o `config.json` / a integração do API Gateway (RNF-03), sem recompilar com IP fixo.

## 7. Requisitos não funcionais

| ID | Como atendemos |
|---|---|
| RNF-01 | RDS PostgreSQL em subnets privadas, `Publicly accessible = No`; só aceita 5432 dos SGs da EC2 e das Lambdas (ver `design.md` §6). |
| RNF-02 | Senhas apenas em `.env` na EC2 (fora do Git) e variáveis de ambiente das Lambdas; `.env.example` sem valores. |
| RNF-03 | Front lê a URL da API em `config.json`; o API Gateway é a URL estável; README tem o passo "nova sessão". |
| RNF-04 | ADR-01: CRUD em container Docker na EC2; Lambdas só para RF-03 e RF-04. |
| RNF-05 | Tudo criado pelo console/CLI e documentado no README; nenhum IaC. |

## 8. Fora do escopo

- Login JWT e papéis (admin/coordenador/visualizador): o sistema original os tem, mas não fazem parte dos requisitos mínimos. Se o código existente já tiver login funcionando, mantemos; não é prioridade.
- Os 5 relatórios exportáveis a Excel: implementamos só o do RF-04.
- Calendário FullCalendar com arrastar e soltar: substituído por uma grade/lista mensal simples (o calendário entra só se sobrar tempo).
- Dias ativos por tipo de turno, notificações, app móvel.
