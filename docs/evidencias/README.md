# Evidências

Prints da aplicação e dos recursos AWS (entrega final). Nome sugerido: `NN-descricao.png`.

| # | Arquivo | O que mostra | Requisito |
|---|---|---|---|
| 01 | `01-vpc-subnets.png` | `cta-vpc` com 2 subnets públicas e 2 privadas, sem NAT | RNF-01 |
| 02 | `02-security-groups.png` | `cta-api-sg`, `cta-lambda-sg`, `cta-rds-sg` (regras de entrada) | RNF-01 |
| 03 | `03-rds-privado.png` | `cta-db` com *Publicly accessible: No* | RNF-01 |
| 04 | `04-nslookup-rds.png` | `nslookup` do endpoint respondendo IP `10.0.x.x` | RNF-01 |
| 05 | `05-ec2-docker.png` | `docker ps` com o container `cta-api` | RNF-04 |
| 06 | `06-api-gateway-rotas.png` | Rotas `ANY /api/{proxy+}` e `GET /api/reports/hours-by-client` | RF-04 |
| 07 | `07-app-login.png` | App aberta pela URL do S3 website | RF-05 |
| 08 | `08-crud-clientes.png` | Cliente e posto criados | RF-01 |
| 09 | `09-cruce-turnos.png` | Erro 409 ao programar turnos sobrepostos | RN-02/RN-03 |
| 10 | `10-bucket-suportes.png` | Arquivo em `supports/novelty-<id>/` | RF-02 |
| 11 | `11-cloudwatch-lambda.png` | Log `Soporte registrado` da `process-support` | RF-03 |
| 12 | `12-novidade-presentado.png` | Novidade com suporte "Presentado" | RF-03 |
| 13 | `13-relatorio-horas.png` | Aba "Horas por cliente" com dados | RF-04 |
| 14 | `14-lambdas-vpc.png` | Configuração de VPC das duas Lambdas | RF-03/RF-04 |
