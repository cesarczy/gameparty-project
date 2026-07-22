# Módulo: Catálogo de Jogos

## Responsabilidade

Cadastro e consulta de **Jogos**, **Categorias** e **Modos de Jogo**; slugs para URLs; seeds iniciais do catálogo.

## Agregados

- `Jogo`
- `Categoria`

## Use Cases (MVP)

- CadastrarJogo
- CadastrarCategoria
- ListarJogosPorCategoria
- ObterJogoPorSlug
- ListarCategorias

## Integrações

| Contexto | Tipo | Mecanismo |
|----------|------|-----------|
| Salas ao Vivo | Customer-Supplier | `GameCatalogReader` (exists + snapshot) |
| Identidade | Customer-Supplier | Validação de `GameId` para favoritos |
