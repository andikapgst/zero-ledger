# Zero Ledger — PWA Pencatat Keuangan Pribadi

> **Stack:** React 18 + Vite + Tailwind CSS 3 + Lucide React + Firebase (Auth + Firestore)  
> **PWA:** `vite-plugin-pwa` with Workbox service worker, installable to home screen

---

## 🚀 Quick Start

### 1. Konfigurasi Firebase

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Buat project baru atau pilih yang sudah ada
3. Aktifkan **Authentication → Google Sign-In**
4. Buat database **Cloud Firestore** (mode production)
5. Buka **Project Settings → Your Apps → Web App** → salin config
6. Rename `.env.example` → `.env` dan isi nilainya:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Firestore Security Rules

Salin rules berikut ke Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /wallets/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    match /transactions/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    match /budgets/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    match /debts/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

### 3. Firestore Indexes (Composite)

| Collection    | Fields                           |
|---------------|----------------------------------|
| wallets       | uid ASC, createdAt ASC           |
| transactions  | uid ASC, date DESC               |
| transactions  | uid ASC, walletId ASC, date DESC |
| budgets       | uid ASC, month ASC               |
| debts         | uid ASC, createdAt DESC          |

### 4. PWA Icons

Tambahkan icon aplikasi di folder `public/icons/`:

```
public/
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png   ← wajib (also maskable)
│   ├── icon-384.png
│   └── icon-512.png   ← wajib (also maskable)
└── favicon.svg
```

> Gunakan [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) atau [Maskable.app](https://maskable.app/editor).

### 5. Install & Jalankan

```bash
npm install
npm run dev
```

Build untuk production:

```bash
npm run build
npm run preview
```

---

## 📂 Struktur Proyek

```
src/
├── contexts/
│   └── AuthContext.jsx
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx
│   │   └── BottomNav.jsx
│   └── ui/
│       ├── LoadingScreen.jsx
│       └── ProtectedRoute.jsx
├── lib/
│   ├── firebase.js
│   └── utils.js
└── pages/
    ├── LoginPage.jsx
    ├── HomePage.jsx
    ├── TransaksiPage.jsx
    ├── TambahTransaksiPage.jsx
    ├── WalletPage.jsx
    └── AnalisisPage.jsx
```

---

## 🎨 Tema Dark Mode

| Token    | Hex       | Fungsi                   |
|----------|-----------|--------------------------|
| `bg`     | `#0B1215` | Background utama         |
| `surface`| `#121A1E` | Card / surface           |
| `teal`   | `#2DD4BF` | Aksen (CTA, active nav)  |
| `muted`  | `#64748B` | Teks sekunder            |

---

## 🗄 Skema Firestore

### `users/{uid}`
| Field       | Type      |
|-------------|-----------|
| uid         | string    |
| displayName | string    |
| email       | string    |
| photoURL    | string    |
| currency    | string    |
| createdAt   | Timestamp |

### `wallets/{walletId}`
| Field     | Type      |
|-----------|-----------|
| uid       | string    |
| name      | string    |
| type      | bank/cash/e-wallet/investment |
| balance   | number    |
| isDefault | boolean   |
| createdAt | Timestamp |
| updatedAt | Timestamp |

### `transactions/{transactionId}`
| Field      | Type      |
|------------|-----------|
| uid        | string    |
| walletId   | string    |
| type       | income/expense/transfer |
| amount     | number    |
| category   | string    |
| note       | string    |
| date       | Timestamp |
| toWalletId | string/null |
| createdAt  | Timestamp |

### `budgets/{budgetId}`
| Field    | Type      |
|----------|-----------|
| uid      | string    |
| category | string    |
| limit    | number    |
| spent    | number    |
| period   | monthly/weekly |
| month    | YYYY-MM   |
| createdAt| Timestamp |

### `debts/{debtId}`
| Field    | Type      |
|----------|-----------|
| uid      | string    |
| type     | debt/receivable |
| person   | string    |
| amount   | number    |
| dueDate  | Timestamp/null |
| note     | string    |
| isPaid   | boolean   |
| createdAt| Timestamp |

---

## 📲 Install ke HP (PWA)

1. Buka di Chrome (Android) → menu ⋮ → **"Tambahkan ke Layar Utama"**
2. Buka di Safari (iOS) → Share → **"Add to Home Screen"**
3. App berjalan mode `standalone` tanpa browser bar
