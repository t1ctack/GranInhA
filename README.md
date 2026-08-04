# 🐷 GranInhA

> Controle financeiro pessoal com porquinhos, cartões e carteiras — e um chat inteligente.

## O que é?

GranInhA é um PWA de controle financeiro pessoal onde você cria **contas** de três tipos:

| Tipo | Emoji | Uso típico |
|------|-------|------------|
| Porquinho | 🐷 | Poupança / reservas |
| Cartão | 💳 | Cartões de crédito/débito |
| Carteira | 👛 | Dinheiro em espécie |

Você registra ganhos e gastos **manualmente** ou via **chat com linguagem natural**:

```
"desconte 300 do porquinho do Inter"
"adicione 1500 na carteira principal"
"quanto tenho no total?"
```

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + Vite |
| Estilo | Tailwind CSS |
| Rotas | React Router v6 |
| PWA | vite-plugin-pwa + Workbox |
| Backend | Firebase (próxima etapa) |
| Chat AI | Claude API (próxima etapa) |

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/            # Botões, inputs, modais reutilizáveis
│   ├── layout/        # Sidebar, BottomNav, Layout
│   ├── accounts/      # Cards de conta
│   ├── transactions/  # Lista e formulário de transações
│   └── chat/          # Interface do chat
├── pages/             # Dashboard, Accounts, Transactions, Chat
├── hooks/             # useAccounts, useTransactions
├── services/          # chatParser, firebase (futuro)
├── assets/            # Imagens e ícones
└── styles/            # index.css (Tailwind)
```

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

## Build de produção

```bash
npm run build
npm run preview
```

## Roadmap

- [x] Estrutura inicial do projeto (React + Vite + Tailwind + PWA)
- [ ] Integração com Firebase (Auth + Firestore)
- [ ] CRUD de contas com modal
- [ ] CRUD de transações
- [ ] Parser de linguagem natural no chat
- [ ] Integração com Claude API para o chat
- [ ] Gráficos de evolução
- [ ] Export de extrato em CSV/PDF
