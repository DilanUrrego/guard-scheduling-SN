# Clave Seguridad CTA — Programação de Turnos (Projeto 2)

Sistema web para programar turnos de vigilantes de uma empresa de segurança privada, publicado na AWS (Learner Lab).

**Projeto individual.** A IA usada em todas as etapas é o **Claude (Anthropic)**.

## Autor

| Nome | GitHub |
|---|---|
| *[seu nome]* | [DilanUrrego](https://github.com/DilanUrrego) |

## Onde estão os artefatos

| Artefato | Caminho | Status |
|---|---|---|
| Especificação | `spec/spec.md` | v0.3 |
| Design / arquitetura | `spec/design.md` | v0.3 (Aula 3) |
| Tarefas | `spec/tasks.md` | v0.3 (Aula 3) |
| Log de IA | `docs/ia-log.md` | em andamento |
| Landing page (S3) | `landing/index.html` | Aula 2 |
| Backend (NestJS + Prisma) | `backend/` | Docker na EC2 |
| Scripts SQL versionados | `backend/prisma/migrations/*/migration.sql` | Aula 3 |
| Front-end (Angular) | `frontend/` | publicação na Aula 4 |
| Evidências | `docs/evidencias/` | entrega final |

---

## Como criar a infraestrutura (sem IaC, pelo console)

Região: **us-east-1**. Ordem: VPC → Security Groups → RDS → EC2 → API Gateway.

### 1. VPC

1. **VPC → Create VPC → "VPC and more"**.
2. Name tag: `cta` · IPv4 CIDR: `10.0.0.0/16`.
3. Availability Zones: **2** · Public subnets: **2** · Private subnets: **2**.
4. **NAT gateways: None** (custa dinheiro e não é necessário).
5. VPC endpoints: **S3 Gateway** (gratuito; será usado pelas Lambdas na Aula 4).
6. Deixe marcado *Enable DNS hostnames* e *Enable DNS resolution* → **Create VPC**.

Resultado: `cta-vpc`, 2 subnets públicas (com rota para o Internet Gateway), 2 subnets privadas (sem rota para a internet) e o endpoint do S3.

### 2. Security Groups (VPC → Security groups → Create)

Todos na VPC `cta-vpc`:

| Nome | Inbound | Por quê |
|---|---|---|
| `sg-ec2-api` | TCP **3000** de `0.0.0.0/0` · TCP **22** da prefix list `com.amazonaws.us-east-1.ec2-instance-connect` | API Gateway chama a API; SSH só pelo EC2 Instance Connect do console |
| `sg-lambda` | nenhuma | as Lambdas (Aula 4) só iniciam conexões |
| `sg-rds` | TCP **5432** com origem **`sg-ec2-api`** e outra regra com origem **`sg-lambda`** | só a EC2 e as Lambdas chegam ao banco (RNF-01) |

Crie `sg-ec2-api` e `sg-lambda` primeiro, porque o `sg-rds` aponta para eles.

### 3. RDS PostgreSQL (privado)

1. **RDS → Subnet groups → Create**: nome `cta-db-subnets`, VPC `cta-vpc`, as **2 subnets privadas**.
2. **RDS → Create database → Standard create**:
   - Engine: **PostgreSQL 16.x** · Template: **Free tier** (ou Dev/Test).
   - DB instance identifier: `cta-db` · Master username: `cta_admin`.
   - Credentials management: **Self managed** → defina a senha (guarde fora do Git).
   - Instance: **db.t3.micro** · Storage: 20 GB, *sem* autoscaling.
   - Connectivity: VPC `cta-vpc`, subnet group `cta-db-subnets`, **Public access: No**, Security group: **`sg-rds`** (remova o `default`).
   - Monitoring: **desmarque Enhanced monitoring** (o Learner Lab não permite criar o role).
   - *Additional configuration* → **Initial database name: `clave_scheduling`**.
3. Espere o status **Available** (~10 min) e copie o **Endpoint**.

> Prova de que é privado: `nslookup <endpoint>` responde um IP `10.0.x.x`, que não existe fora da VPC.

### 4. EC2 com Docker

1. **EC2 → Launch instance**: nome `cta-api`, **Amazon Linux 2023**, **t3.micro**, key pair `vockey`.
2. Network settings → *Edit*: VPC `cta-vpc`, uma **subnet pública**, *Auto-assign public IP*: **Enable**, Security group: **`sg-ec2-api`**.
3. Advanced details → IAM instance profile: **`LabInstanceProfile`**.
4. Advanced details → **User data**:
   ```bash
   #!/bin/bash
   dnf install -y docker git postgresql16
   systemctl enable --now docker
   usermod -aG docker ec2-user
   # 1 GB de swap: a t3.micro tem só 1 GB de RAM para compilar
   dd if=/dev/zero of=/swapfile bs=1M count=1024 && chmod 600 /swapfile
   mkswap /swapfile && swapon /swapfile && echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
   ```
5. **Launch**. Quando estiver *Running*, clique em **Connect → EC2 Instance Connect → Connect**.

### 5. Backend no container

No terminal da EC2:

```bash
git clone https://github.com/DilanUrrego/guard-scheduling-SN.git
cd guard-scheduling-SN/backend
cp .env.example .env
nano .env
```

Preencha o `.env` (este arquivo **não** vai para o Git):

```ini
DATABASE_URL=postgresql://cta_admin:<SENHA>@<ENDPOINT-DO-RDS>:5432/clave_scheduling
DATABASE_SSL=true
JWT_SECRET=<saída de: openssl rand -hex 32>
FRONTEND_URL=http://localhost:4200
PORT=3000
SEED_PASSWORD=<senha inicial dos usuários de exemplo>
```

Construa a imagem, crie as tabelas e suba a API:

```bash
docker build -t cta-api .                                           # ~5 min na t3.micro
docker run --rm --env-file .env cta-api npx prisma migrate deploy   # aplica os scripts SQL versionados
docker run --rm --env-file .env cta-api npx prisma db seed          # dados de exemplo
docker run -d --name cta-api --restart unless-stopped --env-file .env -p 3000:3000 cta-api
docker logs cta-api                                                 # deve mostrar "Backend corriendo"
curl http://localhost:3000/api                                      # deve responder
```

Para conferir as tabelas no RDS (opcional):
```bash
psql "postgresql://cta_admin:<SENHA>@<ENDPOINT-DO-RDS>:5432/clave_scheduling?sslmode=require" -c '\dt'
```

### 6. API Gateway (HTTP API)

1. **API Gateway → Create API → HTTP API → Build**.
2. Integrations → **HTTP** · Method **ANY** · URL: `http://<DNS-PÚBLICO-DA-EC2>:3000/api/{proxy}` · API name: `cta-api-gw`.
3. Configure routes: Method **ANY** · Resource path **`/api/{proxy+}`** · Integration target: a integração acima.
4. Stage: `$default` com **auto-deploy** → **Create**.
5. **CORS → Configure**:
   - Access-Control-Allow-Origin: `http://localhost:4200` (na Aula 4, acrescentar a URL do S3 website)
   - Access-Control-Allow-Headers: `content-type, authorization`
   - Access-Control-Allow-Methods: `GET, POST, PATCH, DELETE, OPTIONS`
6. Copie a **Invoke URL** (`https://<id>.execute-api.us-east-1.amazonaws.com`).

Teste: abra `https://<id>.execute-api.us-east-1.amazonaws.com/api/docs` → o Swagger deve carregar.

### 7. Front-end apontando para a AWS (até a Aula 4, rodando local)

Em `frontend/src/environments/environment.ts`:
```ts
apiUrl: 'https://<id>.execute-api.us-east-1.amazonaws.com/api',
```
```bash
cd frontend && npm install && npx ng serve
```
Abra `http://localhost:4200` e entre com `admin@claveseguridad.com` e a `SEED_PASSWORD`.

---

## Nova sessão do Learner Lab (RNF-03)

Quando o lab reinicia, o **IP/DNS público da EC2 muda**. O resto continua igual.

1. **Start Lab** e espere o RDS ficar *Available* e a EC2 *Running*.
2. Copie o novo **Public IPv4 DNS** da EC2.
3. **API Gateway → `cta-api-gw` → Integrations →** edite a URL para `http://<NOVO-DNS>:3000/api/{proxy}`.
4. Pronto: o container sobe sozinho (`--restart unless-stopped`) e o front continua usando a mesma Invoke URL, sem mudar código.

Se o container não estiver rodando: `docker start cta-api`.

## Desenvolvimento local

```bash
cd backend
cp .env.example .env        # DATABASE_SSL=false e credenciais locais
docker compose up -d        # PostgreSQL local
npm install
npx prisma migrate deploy && npx prisma db seed
npm run start:dev
```
