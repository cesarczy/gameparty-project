# Harness — Validação automatizada

Verifica conformidade arquitetural antes da entrega (Spec 12).

## Execução

```bash
chmod +x harness/scripts/*.sh   # primeira vez
./harness/scripts/run-harness.sh
```

## Checks

| Script | Verifica |
|--------|----------|
| `run-harness.sh` | Orquestrador — exit 0 = PASS |
| `check-layer-dependencies.sh` | Domain sem imports proibidos |
| `check-ddd-compliance.sh` | Naming use-case, sem service no domain |
| `check-prisma-schema.sh` | Prisma isolado em infrastructure |
| `check-architecture.sh` | Estrutura mínima kit/módulos |

## Configuração

Editar `config/checks.yaml` para habilitar/desabilitar checks.

## CI (exemplo GitHub Actions)

```yaml
- name: Architecture Harness
  run: ./harness/scripts/run-harness.sh
```

## Exit codes

- `0` — PASS
- `1` — FAIL (corrigir e reexecutar)
