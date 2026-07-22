# Domain-Driven Design — Resumo de Padrões

> Fonte: *Implementing Domain-Driven Design*, Vaughn Vernon

## Estratégico

| Padrão | Descrição | Artefato |
|--------|-----------|----------|
| Bounded Context | Limite explícito de modelo | `docs/context-map.md` |
| Context Map | Relacionamentos entre contextos | Spec 02 |
| Ubiquitous Language | Vocabulário compartilhado | `docs/glossary.md` |
| Anti-Corruption Layer | Traduz modelos externos | infrastructure/acl/ |

## Tático

| Padrão | Descrição | Rule |
|--------|-----------|------|
| Entity | Identidade + ciclo de vida | `ddd-aggregates.mdc` |
| Value Object | Igualdade por valor, imutável | `ddd-value-objects.mdc` |
| Aggregate | Cluster de consistência | `ddd-aggregates.mdc` |
| Domain Event | Fato passado relevante | `ddd-domain-events.mdc` |
| Repository | Persistência de agregados | `ddd-repositories.mdc` |
| Domain Service | Lógica sem entidade natural | domain/services/ (raro) |
| Application Service | Orquestração | `use-cases.mdc` |
| Factory | Criação complexa | métodos `create()` nos agregados |

## Fluxo de modelagem

```
Event Storming / Discovery
        ↓
Bounded Contexts (Spec 02)
        ↓
Aggregates + VOs + Events (Spec 03)
        ↓
Use Cases (Spec 04)
        ↓
Repositories + Persistence (Spec 07-08)
```
