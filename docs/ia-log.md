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
- ✏️ Corrigido por mim: os nomes de Security Group propostos (`sg-ec2-api`, `sg-lambda`, `sg-rds`) não são aceitos pela AWS, porque o prefixo `sg-` é reservado. Renomeei para `cta-api-sg`, `cta-lambda-sg` e `cta-rds-sg` (detalhes na Entrada 05).

---

## Entrada 05 — Deploy da Aula 3 e depuração com a IA

- **Data:** 22–23/10/2026 (madrugada antes da Aula 3)
- **Ferramenta:** Claude (chat), com acesso à pasta local do projeto para editar o front-end
- **Contexto dado:** README da Aula 3, mensagens de erro do console da AWS, do terminal da EC2 e do navegador

**Prompts (originais em espanhol, resumidos):**
```
"Dá-me o passo a passo para criar a infraestrutura."
"Os security groups não podem começar com sg-; como os nomeio?"
"Não aparece vockey nem LabInstanceProfile."
"docker: command not found" (+ log do cloud-init)
"Error: P1001 / P1000" (+ saída do prisma migrate deploy)
"{"message":"Service Unavailable"}" ao abrir o Swagger pelo API Gateway
"Erros de rotas de estilos no Angular; podes separar os styles em arquivos?"
"Login: credenciais inválidas" (+ erro de CORS do console)
```

**Problemas, causa e solução:**

| # | Sintoma | Causa | Solução | Quem identificou |
|---|---|---|---|---|
| 1 | AWS recusou o nome `sg-ec2-api` | `sg-` é reservado para IDs | Padrão `cta-<camada>-sg` | **Eu** (corrigi a proposta da IA) |
| 2 | Sem `vockey` nem `LabInstanceProfile` | Estava numa conta AWS com créditos, não no Learner Lab | Seguir nessa conta respeitando as restrições do lab; migrar na Aula 4 (ADR-12) | IA levantou a hipótese, eu confirmei |
| 3 | `docker: command not found` | O *user data* foi colado com espaços antes de `#!/bin/bash` e não executou | Instalação manual; README corrigido | IA, pelo log do cloud-init |
| 4 | `P1001 Can't reach database server` | Rede entre EC2 e RDS — *[confirmar: SG da EC2 diferente de `cta-api-sg` / regra do `cta-rds-sg`]* | *[confirmar o que alterei]* | Eu, seguindo o checklist da IA |
| 5 | `P1000 Authentication failed` | Usuário `cta-admin` (com hífen) no `.env`; o RDS não aceita hífen no usuário | Usar o *Master username* exato | IA |
| 6 | `503 Service Unavailable` no API Gateway | API Gateway não alcançava a EC2 — *[confirmar: URL da integração / porta 3000]* | *[confirmar o que alterei]* | Eu, seguindo o checklist da IA |
| 7 | Build do Angular falhava ao importar estilos | 3 componentes com um `../` a mais no `@use` | Estilos em `.scss` + `includePaths` (ADR-11) | Eu propus separar os estilos; a IA acrescentou o `includePaths` |
| 8 | Formulários de turnos e postos sem botões de dias/mensagens | `*ngIf`/`*ngFor` sem `CommonModule` | Importar `CommonModule` | IA, pelos warnings do build |
| 9 | Login mostrava "credenciais inválidas" | Na verdade era **CORS** no preflight; o front mostra a mesma mensagem para qualquer erro | Configurar o CORS do API Gateway — *[confirmar a opção usada]* | IA, pelo console do navegador |
| 10 | `npm ci` falhava com o lock do GitHub | `package-lock.json` versionado desatualizado | Versionar o lock local | IA |

**O que aceitei, corrigi ou rejeitei:**
- ✅ Aceito: separar estilos em `.scss` + `includePaths`, `CommonModule`, diagnóstico de CORS.
- ✏️ Corrigido por mim: nomes dos Security Groups; *user data* colado sem espaços.
- ❌ Rejeitado: criar um role IAM próprio na conta com créditos — não seria possível no Learner Lab.

**Aprendizados:**
- Ler a mensagem exata do erro muda tudo: P1001 é **rede**, P1000 é **credencial**, 503 é **integração**.
- Testar por camadas (EC2 direto na porta 3000 → API Gateway → navegador) mostra em qual trecho está o problema.
- Uma mensagem de erro do front pode enganar ("credenciais inválidas"); o console do navegador mostra a causa real.
- A IA propôs nomes inválidos e um *user data* frágil; eu preciso validar tudo no console antes de aceitar.
