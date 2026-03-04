# JayneSimu LMS 🩺

Plataforma de Estudos para Residência Médica (ENAMED/ENARE)

![JayneSimu Dashboard](https://via.placeholder.com/800x400/0f172a/14b8a6?text=JayneSimu+LMS)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Schema do Firestore](#schema-do-firestore)
- [Algoritmo SRS (SM-2)](#algoritmo-srs-sm-2)

---

## 🎯 Visão Geral

JayneSimu é uma plataforma LMS (Learning Management System) especializada na preparação para provas de residência médica, com foco em:

- **Aprendizado Ativo**: Sistema de repetição espaçada (SRS) para otimizar a retenção
- **Cronograma Personalizado**: Agenda de estudos baseada em calendário
- **Questões de Provas Anteriores**: Banco de questões filtráveis por especialidade
- **Analytics Avançados**: Gráficos de evolução e desempenho por área

---

## ✨ Funcionalidades

### 🔐 Acesso Restrito
- Login com Firebase Authentication
- Sem auto-cadastro (apenas admin cria usuários)
- Sessões persistentes com refresh automático

### 📅 Agenda do Dia
- Calendário interativo com cronograma de estudos
- Embed de vídeo-aulas do Google Drive
- Visualizador de PDFs integrado
- Atalhos para flashcards e questões do tema

### 🧠 Motor de Aprendizagem Ativa (SRS)
- Algoritmo SM-2 (SuperMemo 2) implementado
- Cálculo automático de intervalos de revisão
- Tracking de facilidade e streak por item
- Priorização inteligente de revisões

### 📝 Sistema de Questões
- Filtros por: Matéria, Sub-assunto, Quantidade
- Exclusão automática de questões respondidas nos últimos 15 dias
- Feedback imediato com explicações
- Histórico completo de tentativas

### 🏆 Super Simulado (Sábados)
- Simulado de 100 questões
- Disponível apenas sábado/domingo
- Ranking comparativo entre usuários
- Cálculo de percentil

### 📊 Analytics
- Gráficos de evolução temporal (Recharts)
- Desempenho por especialidade médica
- Taxa de acerto e tempo médio
- Tendências de melhoria

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Animações** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Firebase (Auth + Firestore) |
| **Storage** | Google Drive API |
| **PWA** | Vite PWA Plugin + Workbox |
| **Icons** | Lucide React |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
├─────────────────────────────────────────────────────────┤
│  Pages    │  Components  │  Contexts  │  Hooks          │
│  ─────    │  ──────────  │  ────────  │  ─────          │
│  Login    │  Dashboard   │  Auth      │  useAuth        │
│  Dashboard│  Questions   │  Study     │  useStudy       │
│  Questions│  Analytics   │            │  useSRS         │
│  Analytics│  Flashcards  │            │                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                        │
├─────────────────────────────────────────────────────────┤
│  Firebase Service  │  Google Drive  │  SRS Algorithm    │
│  ────────────────  │  ────────────  │  ─────────────    │
│  Auth              │  Video Embed   │  SM-2 Calc        │
│  Firestore CRUD    │  PDF Embed     │  Review Priority  │
│  Real-time Sync    │  File Metadata │  Stats Calc       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                      │
├─────────────────────────────────────────────────────────┤
│  Authentication    │  Firestore Database                 │
│  ──────────────    │  ───────────────────                │
│  Email/Password    │  users, questions, flashcards       │
│  Session Mgmt      │  srs_data, study_sessions           │
│                    │  simulados, simulado_results        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Firebase
- Conta Google Cloud (para Drive API)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/jaynesimu-lms.git
cd jaynesimu-lms

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse http://localhost:5173
```

---

## ⚙️ Configuração

### 1. Firebase Setup

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** com Email/Password
3. Crie um banco **Firestore** (modo produção)
4. Copie as credenciais do projeto

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Google Drive API
VITE_GOOGLE_DRIVE_API_KEY=AIzaSy...

# App Config
VITE_APP_NAME=JayneSimu
VITE_APP_VERSION=1.0.0
```

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Questões: leitura para autenticados, escrita apenas admin
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // SRS Data: usuário só acessa seus próprios dados
    match /srs_data/{docId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Study Sessions
    match /study_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Question Attempts
    match /question_attempts/{attemptId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Simulados: leitura para todos, escrita apenas admin
    match /simulados/{simuladoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Simulado Results
    match /simulado_results/{resultId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Schedules: leitura para todos
    match /schedules/{scheduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 4. Criar Usuário Admin (Firestore)

No Firestore, crie manualmente o primeiro usuário admin:

```json
// Collection: users
// Document ID: (use o UID do Firebase Auth)
{
  "uid": "firebase-auth-uid",
  "email": "admin@jaynesimu.com",
  "displayName": "Administrador",
  "role": "admin",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLoginAt": "2025-01-01T00:00:00Z",
  "settings": {
    "dailyGoal": 20,
    "notifications": true,
    "darkMode": true,
    "soundEffects": true
  }
}
```

---

## 🌐 Deploy

### Vercel (Recomendado)

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configure variáveis de ambiente no dashboard
# Settings > Environment Variables
```

### Netlify

```bash
# 1. Instale Netlify CLI
npm i -g netlify-cli

# 2. Login
netlify login

# 3. Build
npm run build

# 4. Deploy
netlify deploy --prod --dir=dist
```

**netlify.toml:**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Actions (CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📁 Estrutura do Projeto

```
jaynesimu-lms/
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── common/
│   │   │   └── index.tsx          # Button, Card, Input, Badge, etc.
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx      # Main agenda component
│   │   ├── questions/
│   │   │   └── QuestionsPage.tsx  # Question filters & session
│   │   ├── flashcards/
│   │   ├── analytics/
│   │   │   └── AnalyticsPage.tsx  # Charts & performance
│   │   ├── simulado/
│   │   └── layout/
│   │       └── MainLayout.tsx     # Sidebar navigation
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── StudyContext.tsx       # Study/SRS state
│   ├── hooks/
│   ├── services/
│   │   ├── firebase.ts            # Firebase config & services
│   │   └── googleDrive.ts         # Drive embed helpers
│   ├── utils/
│   │   └── srsAlgorithm.ts        # SM-2 implementation
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   ├── data/
│   │   └── schedule-example.json  # Sample schedule data
│   ├── styles/
│   │   └── index.css              # Global styles + Tailwind
│   ├── App.tsx                    # Routes & providers
│   └── main.tsx                   # Entry point
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🗄 Schema do Firestore

### Collection: `users`
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  settings: {
    dailyGoal: number;
    notifications: boolean;
    darkMode: boolean;
    soundEffects: boolean;
  }
}
```

### Collection: `questions`
```typescript
{
  id: string;
  subject: 'ginecologia' | 'cirurgia' | 'clinica_medica' | 'pediatria' | 'preventiva';
  subSubject: string;
  year?: number;
  source?: string;           // ENAMED, ENARE, USP, etc.
  statement: string;
  options: Array<{
    id: string;
    text: string;
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
  }>;
  correctAnswer: number;     // índice 0-4
  explanation: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Timestamp;
}
```

### Collection: `srs_data`
```typescript
{
  id: string;                // ID do item (question/flashcard)
  itemType: 'question' | 'flashcard';
  userId: string;
  interval: number;          // dias até próxima revisão
  repetitions: number;       // revisões consecutivas corretas
  easeFactor: number;        // mínimo 1.3
  nextReviewDate: Timestamp;
  lastReviewDate: Timestamp;
  totalReviews: number;
  correctReviews: number;
  streak: number;
  bestStreak: number;
}
```

### Collection: `study_sessions`
```typescript
{
  id: string;
  userId: string;
  date: Timestamp;
  type: 'questions' | 'flashcards' | 'simulado' | 'review';
  subject?: string;
  duration: number;          // segundos
  itemsStudied: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;             // 0-100
}
```

### Collection: `simulado_results`
```typescript
{
  id: string;
  userId: string;
  simuladoId: string;
  startedAt: Timestamp;
  finishedAt: Timestamp;
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  totalCorrect: number;
  totalQuestions: number;
  score: number;
  percentile?: number;
  rank?: number;
}
```

---

## 🧮 Algoritmo SRS (SM-2)

O sistema utiliza o algoritmo **SuperMemo 2 (SM-2)** para repetição espaçada:

### Fórmulas

```
EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))

Onde:
- EF = Ease Factor (fator de facilidade)
- q = Qualidade da resposta (0-5)
```

### Qualidade da Resposta

| Score | Descrição |
|-------|-----------|
| 0 | Erro total - nenhuma lembrança |
| 1 | Erro - lembrou algo errado |
| 2 | Erro - mas reconheceu a resposta |
| 3 | Correto - com dificuldade significativa |
| 4 | Correto - com alguma hesitação |
| 5 | Correto - resposta perfeita |

### Intervalos

- Se q < 3: reset (intervalo = 1 dia)
- Se q ≥ 3:
  - 1ª revisão: 1 dia
  - 2ª revisão: 6 dias
  - n-ésima revisão: intervalo × EF

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido para

Preparação para Residência Médica - ENAMED/ENARE

**Bons estudos! 📚🩺**
