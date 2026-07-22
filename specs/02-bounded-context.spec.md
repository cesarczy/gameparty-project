# Spec 02 — Bounded Context

**Fase:** Estratégia DDD  
**Entrada:** `docs/discovery.md`, `docs/glossary.md`  
**Saída:** `docs/context-map.md`, lista de módulos em `src/modules/`

## Objetivo

Delimitar bounded contexts, definir responsabilidades e relacionamentos.

## Checklist

- [ ] Cada contexto tem nome da linguagem ubíqua
- [ ] Responsabilidade única e clara por contexto
- [ ] Context map com tipos de relacionamento
- [ ] Identificação de Shared Kernel (mínimo) vs duplicação aceitável
- [ ] Contratos de integração (eventos, APIs) esboçados
- [ ] Pastas de módulos criadas (vazias ou com README)

## Context Map — template

```markdown
# Context Map

## Contextos

### Orders
- Responsabilidade: ciclo de vida de pedidos
- Entidades principais: Order, OrderItem

## Relacionamentos

| Upstream | Downstream | Tipo | Integração |
|----------|------------|------|------------|
| Catalog | Orders | Customer-Supplier | API REST |
| Orders | Billing | Published Language | OrderPlaced event |
```

## Critérios de aceite

- Nenhum contexto "Misc" ou "Common" genérico
- Integrações cross-context documentadas
- Módulos top-level criados em `src/modules/<context>/`

## Próximo passo

→ Executar `specs/03-domain-model.spec.md`
