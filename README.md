[![Status da Build](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)](https://github.com/jose-guilherme93/gamecatalog)
[![Licença](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![Tecnologias](https://img.shields.io/badge/Stack-Full%20Stack%20TS-informational)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Monitoramento](https://img.shields.io/badge/Monitoring-Grafana-F46800?logo=grafana&logoColor=white)](https://grafana.com/)

# Documentação do Projeto `Gamecatalog`

Este é um projeto **Node.js/Express.js** estruturado como uma **API REST** robusta. Ele utiliza um design **MVC simplificado**, com foco em separação de responsabilidades entre controladores, modelos e rotas.

---

## ⚙️ Tecnologias e Dependências

O projeto é construído sobre as seguintes tecnologias principais:

* **Node.js**: Ambiente de execução assíncrono (utiliza **ES Modules - ESM**).
* **Express.js**: Framework minimalista para criação de API REST.
* **PostgreSQL (`pg`)**: Driver oficial para conexão com o banco de dados relacional.
* **PNPM**: Gerenciador de pacotes eficiente, garantindo a integridade e *caching* de dependências.
* **Vite/Vitest**: Ambiente de **teste unitário** rápido e moderno.
* **Winston**: Biblioteca de *logging* para gerenciamento estruturado de logs de aplicação.
* **JWT (`jsonwebtoken`)**: Implementação de autenticação baseada em tokens.
* **Dotenv**: Gerenciamento seguro de **variáveis de ambiente**.

---

## 📂 Estrutura de Arquivos

A organização do projeto segue uma arquitetura modular clara, facilitando a navegação e a manutenção:

* **`src/`**: Contém todo o código-fonte da aplicação.
    * **`controllers/`**: Lógica de negócio e manipulação das requisições (a camada de serviço).
    * **`migrations/`**: Scripts SQL ou JS/TS para versionamento e gerenciamento do esquema do banco de dados.
    * **`models/`**: Representação dos dados e interação direta com o banco de dados (a camada de dados).
    * **`routes/`**: Definição dos endpoints da API e mapeamento para os *controllers*.
    * **`utils/`**: Funções utilitárias e *middlewares* compartilhados (`connectDatabase.js`, `middlewares.js`).
* **`package.json`**: Metadados do projeto. O campo `"type": "module"` indica o uso obrigatório de **sintaxe ESM (`import/export`)**.
* **`.env`**: **Variáveis de ambiente sensíveis**. **Este arquivo deve ser sempre ignorado pelo Git.**
* **`pnpm-lock.yaml`**: Garante a **reprodutibilidade exata** das dependências entre ambientes.

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo para configurar e iniciar o projeto no seu ambiente de desenvolvimento.

### 1. Configuração do Ambiente

1.  Certifique-se de ter o **Node.js** (versão 18+ é ideal para ESM) e o **PNPM** instalados.
2.  Crie um arquivo **`.env.development`** na raiz do projeto com as seguintes variáveis de configuração do PostgreSQL e da chave de segurança:

    ```env
        PGHOST=localhost
        PGPORT=5432
        PGUSER=postgres
        PGPASSWORD=crudpass
        PGDATABASE=cruddb
        JWT_SECRET=qwdnqwldo
        GF_SECURITY_ADMIN_USER=admin
        GF_SECURITY_ADMIN_PASSWORD=adminpass
        USERNAME_MAILER=username-mailtrap
        USER_PASSWORD_TRANSPORTER_MAILER=password-mailtrap
    ```
3. ## 🐳 Docker e Gerenciamento de Containers

O projeto utiliza **Docker Compose** para orquestrar o ambiente de banco de dados (`PostgreSQL`) e sua interface de gerenciamento (`pgAdmin`), garantindo que todos os desenvolvedores usem a mesma infraestrutura de dados.

### 1. Inicialização dos Containers

Para iniciar o banco de dados e o pgAdmin, execute o comando abaixo na raiz do projeto (onde está o `docker-compose.yml`):

```bash
docker compose up -d
```

### 2. Instalação de Dependências

Execute o comando de instalação de pacotes PNPM para baixar todas as dependências do `package.json` e garantir o *lock* exato via `pnpm-lock.yaml`:

```bash
pnpm install
