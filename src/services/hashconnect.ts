import { HashConnect } from "hashconnect";
import { AccountId, LedgerId, ContractExecuteTransaction, ContractFunctionParameters, Hbar } from "@hashgraph/sdk";

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

export const executeContractFunction = async (
    accountIdForSigning: string,
    contractId: string,
    functionName: string,
    functionParameters: any,
    gas: number = 500000
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

    try {
        // Try different approaches to get the signer
        let signer;

        console.log('HashConnect instance:', instance);
        console.log('Available instance properties:', Object.keys(instance));

        // Approach 1: Try to get signer directly (some versions might support this)
        if (typeof instance.getSigner === 'function') {
            try {
                signer = instance.getSigner(accountIdForSigning);
                console.log('Using direct getSigner approach');
            } catch (err) {
                console.log('Direct getSigner failed:', err);
            }
        }

        // Approach 2: Try with provider if direct signer failed
        if (!signer) {
            try {
                const topic = instance.hcData?.topic || instance.topic || Object.keys(instance.connectedAccountIds || {})[0];

                if (topic) {
                    console.log('Using provider approach with topic:', topic);
                    const provider = instance.getProvider("testnet", topic, accountIdForSigning);
                    signer = instance.getSigner(provider);
                } else {
                    throw new Error('No topic available');
                }
            } catch (err) {
                console.log('Provider approach failed:', err);
            }
        }

        if (!signer) {
            throw new Error('Could not create signer. Please disconnect and reconnect your wallet.');
        }

        // Build the contract parameters based on function name
        let contractParams = new ContractFunctionParameters();

        console.log('Function parameters:', functionParameters);

        if (functionName === 'createNft') {
            // Validate required parameters
            if (!functionParameters.name || !functionParameters.symbol || !functionParameters.description) {
                throw new Error('Missing required parameters for createNft');
            }

            contractParams
                .addString(functionParameters.name)
                .addString(functionParameters.symbol)
                .addString(functionParameters.description)
                .addInt64(functionParameters.maxSupply)
                .addUint32(functionParameters.autoRenewPeriod);

        } else if (functionName === 'mintNft') {
            // Validate required parameters
            if (!functionParameters.tokenAddress || !functionParameters.metadata) {
                throw new Error('Missing required parameters for mintNft');
            }

            // Ensure token address is properly formatted
            let tokenAddress = functionParameters.tokenAddress;
            if (typeof tokenAddress === 'string' && !tokenAddress.startsWith('0x')) {
                // If it's a Hedera format like "0.0.123", convert to EVM address format
                console.log('Converting Hedera format address:', tokenAddress);
                // For now, use the address as-is since we're getting it from the first transaction
            }

            console.log('Using token address for mint:', tokenAddress);
            console.log('Metadata length:', functionParameters.metadata.length);
            console.log('Available dates:', functionParameters.availableDates);

            contractParams
                .addAddress(tokenAddress)
                .addBytesArray([Buffer.from(functionParameters.metadata)])
                .addUint256Array(functionParameters.availableDates || []);

        } else if (functionName === 'updateAvailability') {
            contractParams
                .addAddress(functionParameters.tokenAddress)
                .addInt64(functionParameters.serialNumber)
                .addUint256(functionParameters.date)
                .addBool(functionParameters.isBooked);

        } else if (functionName === 'transferNft') {
            contractParams
                .addAddress(functionParameters.tokenAddress)
                .addAddress(functionParameters.newOwnerAddress)
                .addInt64(functionParameters.serialNumber);

        } else {
            throw new Error(`Unknown function name: ${functionName}`);
        }

        console.log('Building contract transaction:', { contractId, functionName, gas });

        // Create the transaction step by step to ensure proper construction
        const transaction = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(gas)
            .setFunction(functionName, contractParams)
            .setMaxTransactionFee(new Hbar(2));

        console.log('Transaction built, now freezing with signer...');

        // Freeze the transaction with signer
        const frozenTransaction = await transaction.freezeWithSigner(signer);

        console.log('Transaction frozen, now executing with HashConnect signer...');

        // Execute with signer (this will prompt wallet for signature)
        const response = await frozenTransaction.executeWithSigner(signer);

        console.log('Transaction response:', response);

        // Get receipt with signer
        const receipt = await response.getReceiptWithSigner(signer);

        console.log('Transaction receipt:', receipt);

        return {
            success: true,
            response,
            receipt,
            transactionId: response.transactionId.toString(),
            contractFunctionResult: receipt.contractFunctionResult
        };

    } catch (error) {
        console.error('Contract execution failed:', error);
        throw error;
    }
}; 