# Workflow — Pipeline de Desenvolvimento

## Visão geral

```mermaid
flowchart LR
  P[Master Prompt] --> S1[Spec 01 Discovery]
  S1 --> S2[Spec 02 Context]
  S2 --> S3[Spec 03 Domain]
  S3 --> S4[Spec 04 Use Cases]
  S4 --> S5[Spec 05 Ports]
  S5 --> S6[Spec 06 Modules]
  S6 --> S7[Spec 07 Prisma]
  S7 --> S8[Spec 08 Backend]
  S8 --> S9[Spec 09 Frontend]
  S9 --> S10[Spec 10 Integration]
  S10 --> S11[Spec 11 Testing]
  S11 --> S12[Spec 12 Harness]
  S12 --> H{PASS?}
  H -->|Sim| D[Entrega]
  H -->|Não| F[Correções]
  F --> S12
```

## Camadas de governança

| Camada | Função | Local |
|--------|--------|-------|
| Rules | Guia contínuo durante coding | `.cursor/rules/` |
| Specs | Etapas sequenciais com artefatos | `specs/` |
| Prompt | Orquestração do pipeline | `prompts/master-prompt.md` |
| Harness | Validação objetiva | `harness/scripts/` |

## Reprodutibilidade

- Mesmo prompt + mesmas specs → resultados estruturalmente equivalentes
- Validado em Cursor, Codex e assistentes compatíveis com Rules/AGENTS.md
- Harness elimina subjetividade na conformidade arquitetural

## Iteração

Após entrega MVP:
1. Nova feature → reiniciar do spec relevante (ex: 03 se muda domínio)
2. Sempre reexecutar harness antes de merge
