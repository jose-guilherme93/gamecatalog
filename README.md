# 🎮 GameCatalog Monorepo

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)](https://github.com/jose-guilherme93/gamecatalog)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Full%20Stack-informational)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Go](https://img.shields.io/badge/Worker-Go-00ADD8?logo=go&logoColor=white)](https://go.dev/)

Bem-vindo ao **GameCatalog**, uma plataforma para gerenciamento de avaliações de games para registrar em seu perfil nota, pensamentos, e outras informações sobre qualquer game que jogou ou quer jogar na vida.

---

## 🏛️ Arquitetura do Projeto

O projeto é dividido em três componentes principais localizados na pasta `apps/`:

### 🌐 [Frontend (Next.js)](./apps/web)
Interface do usuário moderna construída com:
- **Next.js 14** (App Router)
- **React 18** & **Tailwind CSS**
- **Lucide React** para ícones
- Autenticação com fluxos de login e registro.

### 🚀 [API (Node.js/Express)](./apps/api-node)
Backend robusto seguindo padrões de excelência:
- **TypeScript** & **Express 5**
- **PostgreSQL** com driver `pg`
- **Zod** para validação de esquemas
- **Winston** & **Winston-Loki** para logs estruturados
- **Vitest** para testes automatizados de alta performance.

### � [Payment Worker (Go)](./apps/worker-donations)
Serviço de alta performance para processamento assíncrono:
- **Go (Golang)**
- Integração com **Redis** para mensageria (filas)
- Orquestração de notificações de e-mail (Paid, Expired, Cancelled) via SMTP.

---

## 🛠️ Stack Tecnológica

| Componente | Tecnologias Principais |
| :--- | :--- |
| **Infraestrutura** | Docker, Docker Compose, PostgreSQL, Redis |
| **Observabilidade** | Grafana, Loki, Winston |
| **Segurança** | Infisical (Gerenciamento de Segredos), JWT, Helmet |
| **Backend** | Node.js, Express, Go |
| **Frontend** | Next.js, Tailwind CSS |

---

## 🚀 Como Iniciar

### 1. Pré-requisitos
Certifique-se de ter instalado:
- **Node.js 18+** & **PNPM**
- **Go 1.21+**
- **Docker** & **Docker Compose**
- **Infisical CLI** (para gerenciamento de variáveis de ambiente)

### 2. Configurações Iniciais
Instale as dependências de todo o monorepo:
```bash
pnpm install
```

### 3. Infraestrutura
Suba os serviços essenciais (Banco de Dados e Cache):
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Rodando o Desenvolvimento
Para rodar todos os aplicativos simultaneamente em modo de desenvolvimento:
```bash
pnpm dev
```
O monorepo irá iniciar:
- **Web**: `http://localhost:3002`
- **API**: `http://localhost:3000`
- **Worker**: Monitorando a fila do Redis

---

## 🧪 Testes e Qualidade
O projeto prioriza a qualidade do código com testes rigorosos:
```bash
# Rodar testes da API
pnpm test
```

---

## � Gerenciamento de Segredos
Utilizamos o **Infisical** para garantir que credenciais sensíveis (APIs de pagamento, bancos de dados, SMTP) nunca vazem. Os scripts de inicialização utilizam `infisical run --` para injetar segredos com segurança em tempo de execução.

---

## 📈 Monitoramento
Logs são centralizados no **Grafana** via **Loki**. Configure seu container Loki para receber logs do `winston-loki` da API para uma visão 360º da saúde do sistema.

---
Desenvolvido por [José Guilherme (Joseti)](https://github.com/jose-guilherme93). MIT License.
