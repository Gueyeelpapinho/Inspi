# 🏠 HederaAirbnb Wallet Connection Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Dependencies Setup](#dependencies-setup)
3. [Project Architecture](#project-architecture)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing Your Implementation](#testing-your-implementation)
6. [Troubleshooting](#troubleshooting)
7. [Demo Script](#demo-script)

---

## 🌟 Overview

This guide explains how to implement **HashConnect wallet integration** for the HederaAirbnb project. HashConnect enables users to connect their Hedera wallets (HashPack, Blade, etc.) to interact with your smart contracts.

### What We'll Build:
- ✅ **Wallet Connection Button** - Connect/disconnect functionality
- ✅ **State Management** - Redux store for wallet state
- ✅ **Account Display** - Show connected account ID
- ✅ **Transaction Signing** - Sign and execute smart contract interactions
- ✅ **Error Handling** - Robust error management

---

## 📦 Dependencies Setup

### 1. Required Dependencies
```bash
npm install hashconnect @hashgraph/sdk @reduxjs/toolkit react-redux
```

### 2. Package.json Dependencies
```json
{
  "dependencies": {
    "@hashgraph/sdk": "^2.40.0",
    "@reduxjs/toolkit": "^2.8.2",
    "hashconnect": "^3.0.13",
    "react-redux": "^9.2.0",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18"
  }
}
```

---

## 🏗️ Project Architecture

```
src/
├── components/
│   ├── HashConnectButton.tsx      # Main wallet button component
│   └── HashConnectButton.module.css
├── hooks/
│   └── useHashConnect.ts          # Custom hook for wallet logic
├── services/
│   └── hashconnect.ts             # HashConnect service layer
├── store/
│   ├── index.ts                   # Redux store configuration
│   └── hashconnectSlice.ts        # Wallet state management
└── pages/
    └── _app.tsx                   # Redux provider setup
```

---

## 🔧 Step-by-Step Implementation

### Step 1: Create HashConnect Service
**File: `src/services/hashconnect.ts`**

```typescript
import { HashConnect } from "hashconnect";
import { AccountId, LedgerId } from "@hashgraph/sdk";

// Configuration
const env = "testnet"; // or "mainnet" for production
const appMetadata = {
    name: "HederaAirbnb",
    description: "Decentralized property rental platform on Hedera",
    icons: [typeof window !== 'undefined' ? window.location.origin + "/favicon.ico" : "/favicon.ico"],
    url: "http://localhost:3000", // Change for production
};

// Initialize HashConnect instance
export const hc = new HashConnect(
    LedgerId.fromString(env),
    "bfa190dbe93fcf30377b932b31129d05", // Your project ID
    appMetadata,
    true // Debug mode
);

// Initialize HashConnect
export const hcInitPromise = hc.init();

// Helper functions
export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized");
    }
    return hc;
};

export const getConnectedAccountIds = () => {
    const instance = getHashConnectInstance();
    return instance.connectedAccountIds;
};

export const getInitPromise = (): Promise<void> => {
    return hcInitPromise;
};

// Transaction signing functions
export const signTransaction = async (
    accountIdForSigning: string,
    transaction: any
) => {
    const instance = getHashConnectInstance();
    await getInitPromise();

    const accountIds = getConnectedAccountIds();
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts");
    }

    const result = await instance.signTransaction(
        AccountId.fromString(accountIdForSigning),
        transaction
    );
    return result;
};

export const executeTransaction = async (
    accountIdForSigning: string,
    transaction: any
) => {
    const instance = getHashConnectInstance();
    const result = await instance.sendTransaction(
        AccountId.fromString(accountIdForSigning),
        transaction
    );
    return result;
};
```

### Step 2: Create Redux Store
**File: `src/store/hashconnectSlice.ts`**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HashConnectState {
  isConnected: boolean;
  accountId: string | null;
  isLoading: boolean;
}

const initialState: HashConnectState = {
  isConnected: false,
  accountId: null,
  isLoading: false,
};

const hashconnectSlice = createSlice({
  name: 'hashconnect',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setConnected: (state, action: PayloadAction<{ accountId: string }>) => {
      state.isConnected = true;
      state.accountId = action.payload.accountId;
      state.isLoading = false;
    },
    setDisconnected: (state) => {
      state.isConnected = false;
      state.accountId = null;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setConnected, setDisconnected } = hashconnectSlice.actions;
export default hashconnectSlice.reducer;
```

**File: `src/store/index.ts`**

```typescript
import { configureStore } from '@reduxjs/toolkit';
import hashconnectReducer from './hashconnectSlice';

export const store = configureStore({
  reducer: {
    hashconnect: hashconnectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Step 3: Create Custom Hook
**File: `src/hooks/useHashConnect.ts`**

```typescript
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setLoading, setConnected, setDisconnected } from '../store/hashconnectSlice';
import { getHashConnectInstance, getInitPromise, getConnectedAccountIds } from '../services/hashconnect';

const useHashConnect = () => {
  const dispatch = useDispatch();
  const hashconnectState = useSelector((state: RootState) => state.hashconnect);
  const { isConnected, accountId, isLoading } = hashconnectState;

  useEffect(() => {
    const setupHashConnect = async () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const instance = getHashConnectInstance();
        await getInitPromise();

        // Set up event listeners
        instance.pairingEvent.on((pairingData: any) => {
          console.log("Wallet paired:", pairingData);
          const accountIds = getConnectedAccountIds();
          if (accountIds && accountIds.length > 0) {
            dispatch(setConnected({
              accountId: accountIds[0].toString()
            }));
          }
        });

        instance.disconnectionEvent.on(() => {
          console.log("Wallet disconnected");
          dispatch(setDisconnected());
        });

        // Check if already connected
        const accountIds = getConnectedAccountIds();
        if (accountIds && accountIds.length > 0) {
          dispatch(setConnected({
            accountId: accountIds[0].toString()
          }));
        }

      } catch (error) {
        console.error('HashConnect setup failed:', error);
        dispatch(setLoading(false));
      }
    };

    setupHashConnect();
  }, [dispatch]);

  const connect = async () => {
    dispatch(setLoading(true));
    try {
      if (typeof window === 'undefined') return;

      const instance = getHashConnectInstance();
      await instance.openPairingModal();
    } catch (error) {
      console.error('Connection failed:', error);
      dispatch(setLoading(false));
    }
  };

  const disconnect = () => {
    try {
      const instance = getHashConnectInstance();
      instance.disconnect();
      dispatch(setDisconnected());
    } catch (error) {
      console.error('Disconnect failed:', error);
      dispatch(setDisconnected());
    }
  };

  return {
    isConnected,
    accountId,
    isLoading,
    connect,
    disconnect,
  };
};

export default useHashConnect;
```

### Step 4: Create Wallet Button Component
**File: `src/components/HashConnectButton.tsx`**

```typescript
import React from 'react';
import useHashConnect from '../hooks/useHashConnect';
import styles from './HashConnectButton.module.css';

const HashConnectButton: React.FC = () => {
  const { isConnected, accountId, isLoading, connect, disconnect } = useHashConnect();

  const formatAccountId = (id: string) => {
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      {!isConnected ? (
        <button
          className={styles.connectButton}
          onClick={connect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className={styles.connectedContainer}>
          <span className={styles.accountId}>
            {formatAccountId(accountId || '')}
          </span>
          <button
            className={styles.disconnectButton}
            onClick={disconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default HashConnectButton;
```

**File: `src/components/HashConnectButton.module.css`**

```css
.container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.connectButton {
  background: #ff5a5f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.connectButton:hover {
  background: #e04448;
}

.connectButton:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.connectedContainer {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 20px;
}

.accountId {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.disconnectButton {
  background: #ff5a5f;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
}

.disconnectButton:hover {
  background: #e04448;
}
```

### Step 5: Setup Redux Provider
**File: `src/pages/_app.tsx`**

```typescript
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { store } from '@/store'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  )
}
```

### Step 6: Add Button to Your Layout
**File: `src/pages/index.tsx` (in header section)**

```typescript
import dynamic from 'next/dynamic';

const HashConnectButton = dynamic(
  () => import('@/components/HashConnectButton'),
  { ssr: false }
);

// In your header JSX:
<div className={styles.nav}>
  <HashConnectButton />
  {/* Other nav items */}
</div>
```

---

## 🧪 Testing Your Implementation

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Connection Flow
1. **Open browser** → `http://localhost:3000`
2. **Click "Connect Wallet"** → HashConnect modal should appear
3. **Select HashPack** → Install if needed
4. **Approve connection** → Account ID should display
5. **Test disconnect** → Should clear wallet state

### 3. Browser Console Testing
```javascript
// Check HashConnect instance
console.log(window.hc);

// Check connected accounts
console.log(window.hc.connectedAccountIds);

// Check pairing data
console.log(window.hc.pairingData);
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "HashConnect not initialized" Error
**Solution:**
- Ensure you're only calling wallet functions on client-side
- Add `typeof window !== 'undefined'` checks

#### 2. Modal Not Appearing
**Solution:**
- Check browser popup blockers
- Verify HashConnect version compatibility
- Clear browser cache

#### 3. Connection Not Persisting
**Solution:**
- Check localStorage permissions
- Verify HashConnect initialization
- Update HashConnect to latest version

#### 4. TypeScript Errors
**Solution:**
```bash
npm install @types/node @types/react @types/react-dom
```

---

## 🎬 Demo Script

### **"Let me show you our Hedera wallet integration..."**

#### **Step 1: Show Disconnected State**
*"Here's our application before wallet connection. Notice the 'Connect Wallet' button in the header."*

#### **Step 2: Initiate Connection**
*"When I click 'Connect Wallet', HashConnect opens a modal showing available Hedera wallets."*

#### **Step 3: Select Wallet**
*"I'll select HashPack - the most popular Hedera wallet. If you don't have it installed, it provides download links."*

#### **Step 4: Approve Connection**
*"HashPack opens asking for permission to connect to our dApp. I'll approve the connection."*

#### **Step 5: Show Connected State**
*"Perfect! Now you can see my account ID displayed: 0.0.XXXXXX. The button changed to show my connected wallet."*

#### **Step 6: Explain Integration**
*"This wallet connection enables several key features:*
- ✅ **Identity Verification** - Know who's making bookings
- ✅ **Payment Processing** - Handle HBAR transactions
- ✅ **Smart Contract Interaction** - Sign property bookings
- ✅ **Ownership Verification** - Confirm NFT property ownership

*All transactions are signed securely through the user's wallet - we never see private keys."*

#### **Step 7: Demonstrate Disconnect**
*"Users can disconnect anytime by clicking the disconnect button. This clears the session and returns to the connection prompt."*

---

## 🚀 Next Steps

### 1. **Smart Contract Integration**
- Use `signTransaction()` for booking smart contracts
- Implement payment flows with HBAR transfers

### 2. **Enhanced UI**
- Add wallet selection options
- Implement connection status indicators
- Create loading states for transactions

### 3. **Error Handling**
- Add user-friendly error messages
- Implement retry mechanisms
- Handle network switching

### 4. **Production Deployment**
- Update metadata URLs
- Switch to mainnet
- Add security validations

---

## 📚 Resources

- **HashConnect Documentation**: https://docs.hedera.com/hashconnect/
- **Hedera SDK**: https://docs.hedera.com/hedera/sdks-and-apis
- **HashPack Wallet**: https://www.hashpack.app/
- **Hedera Portal**: https://portal.hedera.com/

---

**🎉 Congratulations! You now have a fully functional Hedera wallet integration for your decentralized Airbnb platform!**