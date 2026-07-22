# Deploy na VPS — GameParty

Guia para colocar **gameparty.com.br** no ar (Hetzner, Hostinger VPS, etc.).

**O que sobe:** Nginx (frontend estático + proxy) + API Node + PostgreSQL.  
**O que não sobe:** specs, harness, docs, testes — ficam só no repositório de desenvolvimento.

---

## 1. VPS mínima recomendada

| Recurso | Valor |
|---------|-------|
| vCPU | 2 |
| RAM | 4 GB (ideal: 8 GB) |
| Disco | 40–80 GB SSD |
| SO | Ubuntu 24.04 LTS |

---

## 2. Preparar a VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Docker (oficial)
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 3. DNS do domínio

No painel do domínio (**gameparty.com.br**):

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | IP da VPS |
| A | `www` | IP da VPS |

Aguarde propagação (minutos a algumas horas).

---

## 4. Clonar e configurar

```bash
cd ~
git clone <URL_DO_SEU_REPO> gameparty
cd gameparty

cp .env.production.example .env
nano .env   # ou vim — veja checklist abaixo
chmod +x docker/prod.sh
```

### Checklist do `.env`

| Variável | O que colocar |
|----------|----------------|
| `CORS_ORIGIN` | `https://gameparty.com.br` |
| `POSTGRES_PASSWORD` | Senha forte (só no servidor) |
| `JWT_SECRET` | String aleatória ≥ 16 caracteres |
| `ADMIN_PASSWORD` | Senha do admin inicial |
| `RUN_SEED` | `true` **só na primeira subida** |
| `GOOGLE_CLIENT_ID` | Se usar login Google (mesmo ID no OAuth Console) |

Depois do primeiro deploy bem-sucedido, altere no `.env`:

```env
RUN_SEED=false
```

---

## 5. Subir produção

```bash
./docker/prod.sh up
```

Verificar:

```bash
./docker/prod.sh ps
curl -s http://localhost/health
```

Abra `http://SEU_IP` no navegador. Com DNS propagado, `http://gameparty.com.br`.

---

## 6. HTTPS (Let's Encrypt)

Com o site respondendo na porta 80:

```bash
# Parar nginx momentaneamente se certbot standalone for necessário,
# ou use webroot (recomendado — nginx já expõe /.well-known/acme-challenge/)

sudo apt install -y certbot

sudo certbot certonly --webroot \
  -w /var/lib/docker/volumes/gameparty-prod_certbot_www/_data \
  -d gameparty.com.br -d www.gameparty.com.br \
  --email seu@email.com --agree-tos
```

> O caminho do volume pode variar. Liste com: `docker volume inspect gameparty-prod_certbot_www`

Depois, monte os certificados no nginx (ajuste `docker-compose.prod.yml` para mapear `/etc/letsencrypt` e use um `nginx.ssl.conf` com `listen 443 ssl`).  
Alternativa mais simples: **Caddy** ou **Nginx Proxy Manager** na frente dos containers.

Para MVP rápido, muitos começam em HTTP e adicionam SSL na mesma semana.

---

## 7. Comandos úteis

```bash
./docker/prod.sh logs          # todos os serviços
./docker/prod.sh logs api      # só API
./docker/prod.sh restart       # reiniciar
./docker/prod.sh rebuild       # rebuild após git pull
./docker/prod.sh shell-db      # psql
./docker/prod.sh down          # parar tudo
```

---

## 8. Atualizar após mudanças no código

```bash
cd ~/gameparty
git pull
./docker/prod.sh rebuild
```

Migrations rodam automaticamente ao subir a API.

---

## 9. Backup do banco

```bash
docker exec gameparty-prod-db pg_dump -U gameparty gameparty > backup-$(date +%F).sql
```

Guarde o arquivo fora da VPS (S3, máquina local, etc.).

---

## 10. E-mail transacional

Hoje a API usa `ConsoleEmailSender` (log no container). Para produção real:

- SMTP do domínio (`noreply@gameparty.com.br`)
- Ou serviço (Resend, SendGrid, Amazon SES)

Isso exige implementar adapter SMTP — pendente no código.

---

## 11. O que **não** precisa na VPS

```
specs/  prompts/  harness/  tests/  docs/  .cursor/  references/
```

Clone Git traz tudo, mas **só entra na imagem Docker** o necessário (`.dockerignore` exclui o resto).

---

## Arquitetura em produção

```
Internet :80/:443
       ↓
   nginx (frontend dist + proxy)
       ├── /api, /uploads, /health, /ws  →  api:3000
       └── /* (SPA)                       →  arquivos estáticos

   api  →  PostgreSQL (rede interna, sem porta pública)
   volume gameparty_uploads → avatares
```
