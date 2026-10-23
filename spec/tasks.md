# Tarefas — Clave Seguridad CTA

> **Versão 0.3** (Aula 3 · 23/10) — código preparado para rodar na AWS.
> Cada tarefa é pequena e está ligada a um requisito ou história. **Projeto individual:** todas as tarefas são do autor.
> **Status:** ⬜ a fazer · 🔄 em andamento · ✅ feito
> **Regra:** ao implementar com o Claude, dar como contexto `spec/spec.md` + `spec/design.md` + o ID da tarefa, e registrar o prompt em `docs/ia-log.md`.

## Base existente (código anterior ao Projeto 2)

O que já funciona localmente e será reaproveitado:

| ID | O que já existe | Req./HU | Status |
|---|---|---|---|
| B-01 | `schema.prisma` + migration `20260618013948_init` + `seed.ts` | RF-01 · ADR-07 | ✅ |
| B-02 | Login JWT com papéis `admin` / `coordinator` / `viewer` | RN-07 · HU-10 | ✅ |
| B-03 | CRUD clientes e postos (exclusão = inativação) | HU-01 | ✅ |
| B-04 | CRUD tipos de turno com `crosses_midnight` | HU-02 | ✅ |
| B-05 | CRUD vigilantes + retirar/reativar | HU-03 | ✅ |
| B-06 | Programação com validação de descanso e de cruce no mesmo dia | HU-04 · RN-01/02 | ✅ |
| B-07 | CRUD descansos | HU-05 | ✅ |
| B-08 | CRUD novidades + filtro `support_pending` | HU-06 · RN-04 | ✅ |
| B-09 | Telas Angular: login, dashboard, cadastros, calendário, novidades, relatórios | HU-10 | ✅ |

## Aula 1 — 09/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-01 | Criar repositório e dar acesso ao professor | — | Autor | ✅ |
| T-02 | `spec.md` v0.1 | Todas | Autor | ✅ |
| T-03 | Primeira entrada no `ia-log.md` | — | Autor | ✅ |

## Aula 2 — 16/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-04 | `spec.md` v0.3: escopo 1:1 com os requisitos mínimos, alinhado ao código | Todas | Autor | ✅ |
| T-05 | `design.md` v0.2: diagrama, ER real, rotas reais e novas, SGs | Todas | Autor | ✅ |
| T-06 | ADR-01 (CRUD em container × Lambda) | RNF-04 | Autor | ✅ |
| T-07 | Bucket `cta-front-*`: static website + bucket policy + `landing/index.html` | RF-05 | Autor | ✅ |
| T-08 | Registrar no `ia-log.md` a revisão do código | — | Autor | ✅ |

## Aula 3 — 23/10 · VPC, RDS e CRUD na AWS

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-09 | Criar VPC, subnet pública, 2 subnets privadas, IGW e route tables | RNF-01 | Autor | ⬜ |
| T-10 | Criar `sg-ec2-api`, `sg-lambda` e `sg-rds` (design §6) | RNF-01 | Autor | ⬜ |
| T-11 | Criar RDS PostgreSQL 16 privado (subnet group, sem acesso público) | RF-01 · RNF-01 | Autor | ⬜ |
| T-12 | Tirar as senhas do `docker-compose.yml` e do `seed.ts` (variáveis de ambiente) e criar `backend/.env.example` | RNF-02 | Autor | ✅ |
| T-13 | Criar `backend/Dockerfile` e `.dockerignore`; corrigir saída do build (`dist/main.js`) e adicionar `tsx` para o seed | ADR-01 | Autor | ✅ |
| T-12b | Adicionar `DATABASE_SSL` na conexão (`prisma.service.ts` e `seed.ts`): o RDS PostgreSQL 16 exige SSL | RF-01 | Autor | ✅ |
| T-14 | EC2 t3.micro com Docker e `LabInstanceProfile`; rodar o container com `.env` | RF-01 | Autor | ⬜ |
| T-15 | Rodar `prisma migrate deploy` e `prisma db seed` contra o RDS a partir da EC2 | RF-01 · ADR-07 | Autor | ⬜ |
| T-16 | API Gateway HTTP API: `ANY /api/{proxy+}` → EC2:3000 + CORS | ADR-02 | Autor | ⬜ |
| T-17 | Validar cruce com turno do dia anterior/seguinte que cruza a meia-noite | HU-04 · RN-03 | Autor | ✅ |
| T-18 | Demo: CRUD de clientes/postos pelo API Gateway (Swagger ou front local) | RF-01 | Autor | ⬜ |
| T-19 | README: passos de VPC, RDS, EC2 e API Gateway | RNF-03 · RNF-05 | Autor | ✅ |
| T-20 | Atualizar `tasks.md` e `ia-log.md` | — | Autor | ⬜ |

## Aula 4 — 30/10 · Upload, Lambdas, relatório e front

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-21 | Bucket `cta-supports-*` privado com CORS | RF-02 | Autor | ⬜ |
| T-22 | Modelo `SupportDocument` + nova migration | RF-03 | Autor | ⬜ |
| T-23 | `POST /api/novelties/:id/upload-url` (`@aws-sdk/s3-request-presigner`, tipo/tamanho, 5 min) | HU-07 | Autor | ⬜ |
| T-24 | `GET /api/novelties/:id/documents` com URL pré-assinada de download | HU-07 | Autor | ⬜ |
| T-25 | Botão "Anexar suporte" na tela de novidades (PUT direto no S3) | HU-07 | Autor | ⬜ |
| T-26 | VPC Gateway Endpoint S3 na route table privada | RF-03 | Autor | ⬜ |
| T-27 | Lambda `process-support` (`pg` + HeadObject, idempotente) + evento do S3 | HU-08 | Autor | ⬜ |
| T-28 | Lambda `report-hours-by-client` (JOIN/GROUP BY + JWT) + rota no API Gateway | HU-09 · ADR-09 | Autor | ⬜ |
| T-29 | Tela do relatório de horas no Angular | HU-09 | Autor | ⬜ |
| T-30 | Adicionar `fileReplacements` no `angular.json` (hoje o `environment.prod.ts` não é usado), URL do API Gateway, `ng build` e publicar no `cta-front-*` | HU-10 · ADR-06 | Autor | ⬜ |
| T-31 | Conferir que o `design.md` bate com o que está rodando | — | Autor | ⬜ |

## Final — 06/11

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-32 | Testar o README do zero numa sessão nova do Learner Lab | RNF-03 | Autor | ⬜ |
| T-33 | Prints em `docs/evidencias/` (app e recursos AWS) | — | Autor | ⬜ |
| T-34 | Reflexão final no `ia-log.md` | — | Autor | ⬜ |
| T-35 | Montar o ZIP e enviar no Moodle | — | Autor | ⬜ |
| T-36 | (Bônus) Alarme no CloudWatch para erros da Lambda `process-support` | Bônus | Autor | ⬜ |
| T-37 | (Bônus) Segredos no Parameter Store | Bônus | Autor | ⬜ |
