# Clean Architecture — Resumo de Padrões

> Fonte: *Clean Architecture*, Robert C. Martin

## Camadas (The Clean Architecture)

```
┌─────────────────────────────────────────────┐
│  Frameworks & Drivers (DB, Web, UI, Devices)│
├─────────────────────────────────────────────┤
│  Interface Adapters (Controllers, Gateways) │
├─────────────────────────────────────────────┤
│  Application Business Rules (Use Cases)     │
├─────────────────────────────────────────────┤
│  Enterprise Business Rules (Entities)       │
└─────────────────────────────────────────────┘
         ↑ dependências apontam para dentro ↑
```

## Componentes

| Componente | Responsabilidade | Rule/Spec |
|------------|------------------|-----------|
| Entities | Regras críticas de negócio | `ddd-aggregates.mdc`, Spec 03 |
| Use Cases | Orquestração por aplicação | `use-cases.mdc`, Spec 04 |
| Interface Adapters | Conversão de formatos | `ports-adapters.mdc`, Spec 05 |
| Frameworks | Detalhes técnicos | `backend-development.mdc`, Spec 08 |

## SOLID aplicado

- **SRP**: uma razão para mudar por classe
- **OCP**: estender via novos use cases/adapters
- **LSP**: adapters substituíveis
- **ISP**: ports pequenos e focados
- **DIP**: application define interfaces; infra implementa

## Testabilidade

- Entities e use cases testáveis sem UI/DB
- Adapters substituíveis por test doubles
