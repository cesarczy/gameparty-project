# Spec 12 — Validation (Harness)

**Fase:** Conformidade final  
**Entrada:** Projeto completo  
**Saída:** Relatório harness, checklist de entrega

## Objetivo

Validar arquitetura, qualidade e conformidade antes da entrega via harness automatizado.

## Execução

```bash
./harness/scripts/run-harness.sh
```

## Checklist manual + automatizado

- [ ] Harness passa sem erros
- [ ] Nenhum import proibido (domain → prisma/express/react)
- [ ] Context map atualizado
- [ ] README do projeto com setup
- [ ] `.env.example` completo
- [ ] Migrations aplicáveis do zero
- [ ] Demo do fluxo MVP registrada (screenshot ou script)

## Relatório de entrega — template

```markdown
# Delivery Report

## Harness
- Status: PASS/FAIL
- Data: YYYY-MM-DD

## Specs executadas
- [x] 01 … [x] 12

## Débitos conhecidos
- ...

## Como rodar
1. npm install
2. cp .env.example .env
3. npx prisma migrate dev
4. npm run dev
```

## Critérios de aceite

- `./harness/scripts/run-harness.sh` exit code 0
- Todas specs marcadas concluídas
- Projeto reproduzível por terceiro seguindo README

## Fim do pipeline

Pipeline concluído. Iterar apenas via change requests documentadas.
