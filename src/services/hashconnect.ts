import { HashConnect } from "hashconnect";
import { AccountId, LedgerId } from "@hashgraph/sdk";

const env = "testnet";
const appMetadata = {
    name: "HederaAir",
    description: "HederaAir - Hedera Hashgraph DApp",
    icons: [typeof window !== 'undefined' ? window.location.origin + "/favicon.ico" : "/favicon.ico"],
    url:  "http://localhost:3000",
};

// Initialize HashConnect only on client side

export const hc = new HashConnect(
        LedgerId.fromString(env),
        "bfa190dbe93fcf30377b932b31129d05", // projectId
        appMetadata,
        true
    );
    
    console.log(hc)

export const hcInitPromise = hc.init();


export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    return hc;
};

export const getConnectedAccountIds = () => {
    const instance = getHashConnectInstance();
    return instance.connectedAccountIds;
};

export const getInitPromise = (): Promise<void> => {
    if (!hcInitPromise) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    return hcInitPromise;
};

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

    const isAccountIdForSigningPaired = accountIds.some(
        (id) => id.toString() === accountIdForSigning.toString()
    );
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`);
    }

    const result = await instance.signTransaction(AccountId.fromString(accountIdForSigning), transaction);
    return result;
};

export const executeTransaction = async (
    accountIdForSigning: string,
    transaction: any
) => {
    const instance = getHashConnectInstance();
    await getInitPromise();

    const accountIds = getConnectedAccountIds();
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts");
    }

    const isAccountIdForSigningPaired = accountIds.some(
        (id) => id.toString() === accountIdForSigning.toString()
    );
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`);
    }

    const result = await instance.sendTransaction(AccountId.fromString(accountIdForSigning), transaction);
    return result;
};

export const signMessages = async (
    accountIdForSigning: string,
    message: string
) => {
    const instance = getHashConnectInstance();
    await getInitPromise();

    const accountIds = getConnectedAccountIds();
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts");
    }

    const isAccountIdForSigningPaired = accountIds.some(
        (id) => id.toString() === accountIdForSigning.toString()
    );
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`);
    }

    const result = await instance.signMessages(AccountId.fromString(accountIdForSigning), message);
    return result;
}; 