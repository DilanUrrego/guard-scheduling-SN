# Log de uso de IA

Registro dos prompts importantes, do que a IA gerou e do que eu aceitei, rejeitei ou corrigi.

> **Projeto individual.** A IA usada em todas as etapas é o **Claude (Anthropic)**, no lugar do GitHub Copilot.

| Campo | Descrição |
|---|---|
| Data | Quando o prompt foi usado |
| Ferramenta | Claude (chat) |
| Prompt | Texto enviado (resumido se for longo) |
| Saída | O que a IA gerou |
| Decisão | ✅ aceito · ✏️ corrigido · ❌ rejeitado — e por quê |

---

## Entrada 01 — Spec inicial

- **Data:** 16/10/2026
- **Ferramenta:** Claude (chat)
- **Contexto dado:** enunciado do Projeto 2 (PDF) + descrição do sistema Clave Seguridad CTA (problema, módulos, stack Angular/NestJS/Prisma/PostgreSQL)

**Prompt (original em espanhol):**
```
Haz la entrega 1: domínio escolhido; spec.md inicial (problema, personas,
pelo menos 5 histórias, como cada RF se aplica); primeira entrada no ia-log.md.
```

**O que a IA gerou:** `specs/spec.md` v0.1 com problema, 4 personas, 8 histórias com critérios iniciais, tabela RF → histórias, fora do escopo e dúvidas; `README.md` inicial.

**Minhas decisões:**
- ✅ Aceito: domínio, problema e as 4 personas (refletem o processo real da planilha).
- ✏️ A revisar na Entrada 02: a v0.1 mantinha quase todos os módulos do sistema original (descansos separados, 5 relatórios, login com papéis), o que daria trabalho em dobro.
- *[preencher: algo que eu mudei ou rejeitei ao ler a v0.1]*

---

## Entrada 02 — Escopo 1:1 com os requisitos mínimos + design + tarefas

- **Data:** 16/10/2026 (Aula 2)
- **Ferramenta:** Claude (chat)
- **Contexto dado:** `specs/spec.md` v0.1 + enunciado (requisitos mínimos, sequência spec → design → tasks e avisos do Learner Lab)

**Prompt (original em espanhol):**
```
Revisa os requisitos mínimos e analisa se é melhor definir outros requisitos
funcionais que se adaptem aos requisitos mínimos, para não trabalhar em dobro.
Considera também a sequência do enunciado (spec.md → design.md → tasks.md)
e gera primeiro esses arquivos.
```

**O que a IA gerou:**
- `spec.md` v0.2: cada RF do domínio mapeado 1:1 a um requisito mínimo, regras de negócio RN-01..RN-06, 9 histórias com critérios Dado/Quando/Então.
- `design.md`: diagrama de arquitetura e ER em Mermaid, rotas da API, SQL do relatório, Security Groups, 8 ADRs (ADR-01 = RNF-04).
- `tasks.md`: 37 tarefas por entrega.

**Minhas decisões:**
- ✅ Aceito: escopo 1:1 com os requisitos mínimos — evita implementar funcionalidades que não valem nota.
- ✅ Aceito: ADR-01 — CRUD em container Docker na EC2, porque o backend NestJS + Prisma já existe; Lambdas só para RF-03 e RF-04.
- ✏️ Corrigido: o descanso, que na v0.1 era entidade própria, virou um tipo de novidade (ADR-04): uma tabela e uma validação a menos.
- ✏️ Corrigido: os nomes dos estados misturavam português e espanhol; padronizados com o código (`PENDIENTE`, `ENTREGADO`, `NO_REQUIERE`).
- ❌ Fora do escopo: login JWT com papéis, os outros 4 relatórios e o calendário arrastar-e-soltar.
- *[preencher: algo que eu questionei ou mudei no design]*

**Aprendizado:** pedir à IA que relacione cada funcionalidade a um requisito do enunciado deixou claro o que cortar.

---

## Entrada 03 — Alinhar spec, design e tarefas ao código existente

- **Data:** 16/10/2026 (Aula 2)
- **Ferramenta:** Claude (chat), com acesso de leitura ao repositório
- **Contexto dado:** repositório completo (`backend/`, `frontend/`) + `spec.md` v0.2 + `design.md` v0.1 + `tasks.md` v0.1

**Prompt (original em espanhol):**
```
Já adicionei o GitHub. Ajusta o design.md e o tasks.md ao código que já tenho funcionando.
```

**O que a IA encontrou ao ler o código:**
- As entidades reais estão em inglês (`Client`, `Post`, `ShiftConfig`, `Guard`, `Schedule`, `Novelty`, `NoveltyType`, `Rest`, `User`), com IDs `uuid`; o design v0.1 usava nomes em espanhol.
- Já existem: login JWT com papéis, cerca de 50 rotas, validação de descanso e de cruce no mesmo dia, o campo `support_submitted` e o filtro `support_pending`.
- A validação **não** cobre o turno do dia anterior que cruza a meia-noite.
- `environment.prod.ts` aponta para `/api`, o que não funciona num S3 website.
- O `docker-compose.yml` tem a senha do banco escrita (viola o RNF-02).
- Os documentos ficam em `spec/` (não `specs/`).

**O que a IA gerou:** `spec.md` v0.3, `design.md` v0.2 e `tasks.md` v0.2 alinhados ao código, com legenda ✅ existente / 🆕 novo.

**Minhas decisões:**
- ✅ Aceito: manter `rests` separado de `novelties` (ADR-04 invertido): unificar agora seria retrabalho.
- ✅ Aceito: manter o login JWT (já funciona) e reutilizar o token na Lambda do relatório (ADR-09).
- ✅ Aceito: a única mudança no schema é a tabela `support_documents`.
- ✅ Aceito: a rota da Lambda fica em `/api/reports/hours-by-client`, para o front usar uma só URL base.
- ✏️ Corrigido: ADR-06 — em vez de `config.json` em runtime, usar a URL do API Gateway no `environment.prod.ts`, porque ela não muda entre sessões (menos código).
- 🆕 Tarefa criada: T-17 para corrigir a validação do turno que cruza a meia-noite.
- *[preencher: algo que eu questionei ou mudei]*

**Aprendizado:** dar o código real como contexto evitou documentar um sistema diferente do que existe.

---

## Entrada 04 — Preparar o backend para rodar na AWS (Aula 3)

- **Data:** 22/10/2026
- **Ferramenta:** Claude (chat), com acesso de leitura ao repositório
- **Contexto dado:** repositório + `spec/` + entregáveis da Aula 3 do enunciado

**Prompt (original em espanhol):**
```
Agora vamos fazer a entrega da Aula 3. Como você recomenda fazer: Swagger ou Angular?
```

**O que a IA encontrou ao tentar compilar o backend:**
- `npm run build` gerava `dist/src/main.js` (porque `prisma.config.ts` e `prisma/` entravam no build), mas `start:prod` executa `dist/main` → a API não iniciaria no container.
- `prisma.config.ts` usa `tsx` para o seed, mas `tsx` não estava no `package.json`.
- O `seed.ts` tinha as senhas dos usuários de exemplo escritas no código (RNF-02).
- O RDS PostgreSQL 16 exige SSL, e o driver `pg` rejeita o certificado da AWS.
- O `angular.json` não tem `fileReplacements`: o `environment.prod.ts` nunca é usado.

**O que a IA gerou:**
- `backend/Dockerfile`, `.dockerignore`, `.env.example`.
- `tsconfig.build.json` excluindo `prisma/` e `prisma.config.ts`; `tsx` como devDependency.
- `seed.ts` lendo `SEED_PASSWORD`; `docker-compose.yml` lendo as credenciais do `.env`.
- `DATABASE_SSL` em `prisma.service.ts` e `seed.ts` (ADR-10).
- Validação de cruce com turnos que cruzam a meia-noite (T-17 / RN-03) em `schedules.service.ts`.
- README com o passo a passo de VPC, SGs, RDS, EC2, Docker e API Gateway.

**Minhas decisões:**
- ✅ Demo do CRUD com o **Angular local** apontando para o API Gateway, com o **Swagger** como plano B.
- ✅ VPC criada pelo assistente "VPC and more" (2 públicas + 2 privadas, sem NAT, com endpoint S3).
- ✅ SSH só pelo EC2 Instance Connect (prefix list da AWS), em vez de abrir a porta 22 para o meu IP.
- *[preencher: algo que eu testei e mudei durante o deploy]*
