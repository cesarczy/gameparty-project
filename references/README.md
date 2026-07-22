# Referências bibliográficas

## Livros base deste kit

| Livro | Autor | Arquivo local |
|-------|-------|---------------|
| Clean Architecture: A Craftsman's Guide to Software Structure and Design | Robert C. Martin | `../../Área de trabalho/rag/Clean Architecture A Craftsman Guide to Software Structure and Design.pdf` |
| Implementing Domain-Driven Design | Vaughn Vernon | `../../Área de trabalho/rag/AW.Implementing.Domain-Driven.Design.0321834577.mobi` |

> Copie os arquivos para `references/books/` se preferir tudo autocontido no repositório.

## Mapeamento livro → Rules/Specs

### Clean Architecture

| Conceito | Rule | Spec |
|----------|------|------|
| Camadas e regra de dependência | `clean-architecture-layers.mdc` | 05, 06 |
| Entidades | `ddd-entities.mdc` | 03 |
| Use Cases | `use-cases.mdc` | 04 |
| Interface Adapters | `ports-adapters.mdc` | 05, 08, 09 |
| Frameworks & Drivers | `backend-development.mdc`, `prisma-modeling.mdc` | 07, 08 |

### Implementing DDD

| Conceito | Rule | Spec |
|----------|------|------|
| Bounded Context | `ddd-bounded-context.mdc` | 02 |
| Aggregates | `ddd-aggregates.mdc` | 03 |
| Value Objects | `ddd-value-objects.mdc` | 03 |
| Domain Events | `ddd-domain-events.mdc` | 03, 10 |
| Repositories | `ddd-repositories.mdc` | 05, 07, 08 |
| Application Services | `use-cases.mdc` | 04 |
