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
