# Docker / Podman — GameParty

Desenvolvimento **100% containerizado**. Nada de Node.js ou PostgreSQL no Fedora host.

## Opção recomendada: Podman (Fedora)

```bash
sudo dnf install podman podman-compose
```

Opcional — alias `docker` → podman:

```bash
sudo dnf install podman-docker
```

## Subir o projeto

```bash
./docker/dev.sh up
```

| Serviço   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| API       | http://localhost:3000        |
| Health    | http://localhost:3000/health |

Migrations e seed rodam automaticamente na API.

## Comandos

```bash
./docker/dev.sh down
./docker/dev.sh logs
./docker/dev.sh test
./docker/dev.sh reset    # apaga volumes e recria
./docker/dev.sh shell-api
./docker/dev.sh shell-db
```

## Toolbox vs Podman?

| Abordagem | Quando usar |
|-----------|-------------|
| **Podman Compose** | Recomendado no Fedora — rootless, sem Node no host |
| **Toolbox** | Camada extra; dentro dele você ainda rodaria compose |
| **Node no host** | Evitar |

## Troubleshooting

- **Porta 5432 ocupada:** pare Postgres local ou remova o `ports` do serviço `db`
- **Primeiro build lento:** normal (`npm install` nos containers)
- **`permission denied` em `/app/docker/entrypoint-api.sh`:** SELinux no Fedora bloqueia volumes montados. O compose usa `:Z` nos volumes e comandos inline (sem script externo). Se persistir:

```bash
sudo setenforce 0   # só para testar; reative depois com setenforce 1
```

Ou confira se `:Z` está nos volumes do `docker-compose.yml`.
