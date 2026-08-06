# 🐷 GranInhA

> Organização financeira pessoal, do jeito rápido: fale com o app em linguagem natural e ele entende.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38BDF8?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?logo=firebase&logoColor=black)
![React Router](https://img.shields.io/badge/React%20Router-6-CA4245?logo=reactrouter&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-3-8884d8)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)

## O que é

GranInhA é um **PWA de organização financeira pessoal**. A ideia central é reduzir o atrito de registrar entradas e saídas do dia a dia — em vez de preencher formulários, você digita algo como *"desconte 50 do Porquinho do Inter"* ou *"gastei 30 no mercado"* no chat, e o app entende, confirma e registra.

### É importante entender o conceito

Os valores no GranInhA são **fictícios e simbólicos** — o app **não se conecta a nenhuma conta bancária real**, não movimenta dinheiro de verdade e não integra com Open Finance ou bancos. É uma ferramenta de **organização e hábito**, pensada para ser simples e lúdica o suficiente para qualquer pessoa usar, de qualquer idade: separar o dinheiro em "porquinhos" mentais, acompanhar metas visuais e criar disciplina de economia sem a fricção de um app bancário de verdade.

## Funcionalidades

### Autenticação
- Login com **Google** via Firebase Auth (popup), sessão persistida, redirecionamento automático para rotas protegidas.

### Gestão de contas
- Contas do tipo **Porquinho 🐷, Cartão 💳, Carteira 👛, Conta Corrente 🏦 e Outro 📁**, cada uma com nome e cor personalizáveis (paleta de 8 cores).
- Edição e exclusão de conta, com opção de manter o histórico de transações vinculado (marcado como "órfão") ou apagá-lo junto.

### Transações
- Registro manual de entradas e saídas (valor, conta, categoria, descrição, data e hora).
- Extrato agrupado por dia, com opção de **desfazer** uma transação (reverte o saldo da conta automaticamente).
- Limpeza de transações órfãs (de contas já excluídas) e opção de apagar todo o histórico, com confirmação explícita.

### Chat com linguagem natural
- Parser de comandos **construído do zero**, sem depender de nenhuma API de IA paga: entende português coloquial, é **tolerante a erros de digitação** (fuzzy matching) e **confirma antes de executar** qualquer transação.
- Exemplos de comandos: `"desconte 300 do Porquinho do Inter"`, `"adicione 500 na carteira"`, `"gastei 50 em alimentação"`, `"quanto tenho no total?"`, `"desfazer"`.
- Desambiguação quando o nome da conta é parecido com mais de uma existente, sugestões dinâmicas baseadas nas contas reais do usuário, e histórico de conversa persistido no Firestore.

### Categorização de transações
- 9 categorias fixas (alimentação, transporte, moradia, educação, saúde, salário, lazer, compras, outros), cada uma com emoji e cor própria.
- No chat, a categoria é **inferida automaticamente** por palavras-chave no texto (ex: "ifood" → Alimentação) ou pode ser **definida explicitamente** (`"categoria transporte"`); no formulário, a escolha é manual.

### Gráficos
- **Evolução do saldo** (últimos 30 dias, gráfico de área).
- **Gastos por conta ou por categoria** no mês corrente (gráfico de pizza, com alternância entre os dois modos).

### Filtros avançados no extrato
- Filtros combináveis por **conta, tipo (entrada/saída), categoria e período** (presets rápidos ou intervalo de datas customizado).
- Chips removíveis individualmente, contador de filtros ativos, resumo (entradas/saídas/saldo) do resultado filtrado, e estado vazio dedicado quando nada corresponde ao filtro.
- Seleção persistida na **URL**, então dá pra voltar à tela sem perder o filtro aplicado.

### Metas de economia
- Valor-alvo (e data-alvo opcional) por conta, com barra de progresso visual, badge de "Meta atingida! 🎉" e contagem de dias restantes (ou de atraso).
- Tela dedicada listando todas as metas, ordenadas pela mais próxima de ser concluída.
- Destaque sutil no Dashboard quando uma meta está perto (≥ 90%) ou acabou de ser batida.

### Desafios de economia gamificados
- Três formatos: **52 Semanas** (R$1, R$2… até R$52 — total R$1.378), **30 Dias** (valor fixo diário) e **Personalizado** (você define o total e o número de períodos, o app calcula a distribuição crescente).
- Tela com a "trilha" de checkpoints do desafio; marcar um checkpoint pendente cria de verdade uma transação de entrada na conta vinculada.
- Barra de progresso geral e confete (CSS puro) ao concluir o desafio inteiro.

### Modo claro/escuro
- Alternância de tema persistida, aplicada de forma consistente em toda a interface — inclusive gráficos e ícones.

### PWA
- Instalável (manifest + ícones), cache de assets via Workbox para funcionar como um app nativo.

### Design responsivo
- Sidebar fixa no desktop, navegação inferior no mobile, layouts adaptados para mobile, tablet e desktop.

## Capturas de tela

<!--
  Insira as imagens da aplicação aqui antes de publicar o README.
  Sugestão de conteúdo: Dashboard, Chat (fluxo de confirmação), Extrato com filtros,
  tela de Metas e tela de Desafios — nos dois temas (claro/escuro), se possível.

  Exemplo de bloco para cada captura:

  ### Dashboard
  ![Dashboard do GranInhA](docs/screenshots/dashboard.png)

  ### Chat com linguagem natural
  ![Chat do GranInhA](docs/screenshots/chat.png)

  ### Metas e Desafios
  ![Metas](docs/screenshots/goals.png)
  ![Desafios](docs/screenshots/challenges.png)
-->

## Tecnologias

| Camada | Tecnologia |
|---|---|
| UI | React 18 + Vite |
| Estilo | Tailwind CSS |
| Rotas | React Router v6 |
| Gráficos | Recharts |
| Backend / dados | Firebase Auth + Firestore |
| PWA | vite-plugin-pwa + Workbox |
| Ícones | lucide-react |
| Otimização de imagem | sharp |

## Arquitetura e decisões técnicas

- **Parser de linguagem natural sem IA paga.** O chat não chama nenhuma API externa de LLM — o parser (`src/services/chatParser.js`) é implementado do zero: distância de Levenshtein própria para casar verbos, categorias e nomes de conta mesmo com erro de digitação, em quatro estágios de busca (exato → substring → por palavra → fuzzy) até encontrar a conta certa.
- **Consistência atômica de saldo com `runTransaction`.** Toda operação que mexe em dinheiro (criar ou desfazer uma transação) usa `runTransaction` do Firestore para ler o saldo, atualizá-lo e criar/remover o documento da transação como uma única operação atômica — evita saldo dessincronizado mesmo sob escritas concorrentes.
- **Tema com Context API.** `ThemeContext` guarda o tema em `localStorage` e aplica a classe `.dark` no elemento raiz; um pequeno script inline no `index.html` lê essa preferência antes do primeiro paint para evitar o "flash" de tema errado.
- **Progresso sempre derivado do estado real, nunca de uma flag.** Tanto metas quanto desafios calculam o progresso ao vivo (saldo atual ÷ meta, ou checkpoints concluídos ÷ total) em vez de persistir um booleano de "concluído". Isso significa que, se o saldo cair depois de bater uma meta, o progresso reflete a realidade automaticamente — sem estado inconsistente para corrigir.
- **Filtros como estado de URL.** Os filtros do extrato vivem na query string (via `useSearchParams`), então são preserváveis por navegação e, em tese, compartilháveis.

### Modelo de dados (Firestore)

```
users/{uid}/
├── accounts/      # contas (nome, tipo, cor, saldo, meta opcional)
├── transactions/  # lançamentos (tipo, valor, conta, categoria, data)
├── challenges/    # desafios de economia (tipo, cronograma, checkpoints concluídos)
└── chatMessages/  # histórico do chat
```

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/t1ctack/GranInhA.git
cd GranInhA

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# preencha o .env com as credenciais de um projeto Firebase
# (Authentication → Google habilitado, e Firestore criado)

# 4. Rode em desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`.

Outros scripts disponíveis:

```bash
npm run build     # build de produção
npm run preview   # serve o build localmente
npm run lint      # eslint
```

## Créditos

Desenvolvido por [**t1ctack**](https://github.com/t1ctack).
