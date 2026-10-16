# Tarefas — Clave Seguridad CTA

> Cada tarefa é pequena, ligada a um requisito/história e tem um responsável.
> **Projeto individual:** todas as tarefas são do autor.
> **Status:** ⬜ a fazer · 🔄 em andamento · ✅ feito
> **Regra:** ao implementar com o Claude, dar como contexto `spec.md` + `design.md` + o ID da tarefa, e registrar o prompt no `docs/ia-log.md`.

## Aula 1 — 09/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-01 | Criar repositório e dar acesso ao professor | — | Autor | ✅ |
| T-02 | `spec.md` v0.1 (problema, personas, histórias, RFs) | Todas | Autor | ✅ |
| T-03 | Primeira entrada no `ia-log.md` | — | Autor | ✅ |

## Aula 2 — 16/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-04 | `spec.md` v0.2: escopo 1:1 com os requisitos mínimos + critérios de aceite | Todas | Autor | ✅ |
| T-05 | `design.md`: diagrama, ER, rotas, SGs | Todas | Autor | ✅ |
| T-06 | ADR-01 (CRUD em container × Lambda) | RNF-04 | Autor | ✅ |
| T-07 | Criar bucket `cta-front-*` com static website e landing page | RF-05 | Autor | ⬜ |
| T-08 | Registrar no `ia-log.md` os prompts de design | — | Autor | ⬜ |

## Aula 3 — 23/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-09 | Criar VPC, subnets pública/privadas, IGW, route tables | RNF-01 | Autor | ⬜ |
| T-10 | Criar SGs `sg-ec2-api`, `sg-lambda`, `sg-rds` conforme design §6 | RNF-01 | Autor | ⬜ |
| T-11 | Criar RDS PostgreSQL privado (subnet group, sem acesso público) | RF-01 · RNF-01 | Autor | ⬜ |
| T-12 | Ajustar `schema.prisma` ao ER (novedad com tipo DESCANSO, documento, unique) e gerar migration | RF-01 · ADR-04/07 | Autor | ⬜ |
| T-13 | `database/seed.sql` com 2 clientes, 4 postos, 6 turnos, 10 vigilantes | RF-01 | Autor | ⬜ |
| T-14 | CRUD clientes e postos (back + front) | HU-01 | Autor | ⬜ |
| T-15 | CRUD tipos de turno com cálculo de duração | HU-02 | Autor | ⬜ |
| T-16 | CRUD vigilantes com documento único e inativação | HU-03 | Autor | ⬜ |
| T-17 | `POST /programaciones` com validação RN-01/RN-02 + testes dos 3 cenários | HU-04 | Autor | ⬜ |
| T-18 | CRUD novedades + filtro pendentes (RN-04) | HU-05 | Autor | ⬜ |
| T-19 | `Dockerfile` do NestJS + `.env.example` + `.gitignore` | RNF-02 · ADR-01 | Autor | ⬜ |
| T-20 | EC2 t3.micro com Docker, `LabInstanceProfile`, rodar container e `migrate deploy` | RF-01 | Autor | ⬜ |
| T-21 | API Gateway HTTP API: rota `/api/{proxy+}` → EC2 + CORS | RF-01 · ADR-02 | Autor | ⬜ |
| T-22 | README: passos de VPC, RDS, EC2, API Gateway | RNF-03 · RNF-05 | Autor | ⬜ |
| T-23 | Atualizar `tasks.md` e `ia-log.md` | — | Autor | ⬜ |

## Aula 4 — 30/10

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-24 | Bucket `cta-uploads-*` privado com CORS | RF-02 | Autor | ⬜ |
| T-25 | `POST /novedades/{id}/upload-url` (tipo/tamanho, 5 min) | HU-06 | Autor | ⬜ |
| T-26 | Tela de upload no Angular (PUT direto no S3) | HU-06 | Autor | ⬜ |
| T-27 | VPC Gateway Endpoint S3 na route table privada | RF-03 | Autor | ⬜ |
| T-28 | Lambda `procesa-soporte` (pg + HeadObject, idempotente) + trigger S3 | HU-07 | Autor | ⬜ |
| T-29 | Lambda `relatorio-programacion` com JOIN/GROUP BY + rota no API Gateway | HU-08 | Autor | ⬜ |
| T-30 | Tela do relatório no Angular | HU-08 | Autor | ⬜ |
| T-31 | Build do Angular com `config.json` e publicar no `cta-front-*` | HU-09 · ADR-06 | Autor | ⬜ |
| T-32 | Conferir `design.md` com o que está rodando | — | Autor | ⬜ |

## Final — 06/11

| ID | Tarefa | Req./HU | Resp. | Status |
|---|---|---|---|---|
| T-33 | Testar o README do zero numa sessão nova do Learner Lab | RNF-03 | Autor | ⬜ |
| T-34 | Prints em `docs/evidencias/` (app e recursos AWS) | — | Autor | ⬜ |
| T-35 | Reflexão final no `ia-log.md` | — | Autor | ⬜ |
| T-36 | Montar ZIP e enviar no Moodle | — | Autor | ⬜ |
| T-37 | (Bônus) Alarme no CloudWatch para erros da Lambda `procesa-soporte` | Bônus | Autor | ⬜ |
