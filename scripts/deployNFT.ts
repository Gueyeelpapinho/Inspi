import {
    Client,
    AccountId,
    PrivateKey,
    TokenAssociateTransaction,
    TokenId
} from "@hashgraph/sdk";
import { NFTService } from "../src/services/nftService";
import * as dotenv from "dotenv";

// Helper function to convert EVM address to Hedera Account ID


// Helper function to convert EVM address to Token ID
function getTokenIdFromEvmAddress(evmAddress: string): TokenId {
    // Remove '0x' prefix if present
    return TokenId.fromSolidityAddress(evmAddress);
}

async function main() {
    try {
        // Load environment variables
        dotenv.config();

        // Check for environment variables
        const operatorId = process.env.OPERATOR_ID;
        const operatorKey = process.env.OPERATOR_KEY;
        const receiverAddress = process.env.RECEIVER_ADDRESS;

        if (!operatorId || !operatorKey) {
            throw new Error("Environment variables OPERATOR_ID and OPERATOR_KEY must be present");
        }

        if (!receiverAddress) {
            throw new Error("Environment variable RECEIVER_ADDRESS must be present");
        }

        // Create Hedera client
        const client = Client.forTestnet();
        const accountId = AccountId.fromString(operatorId);
        const privateKey = PrivateKey.fromString(operatorKey);
        client.setOperator(accountId, privateKey);

        // Convert receiver's EVM address to Account ID if it's an EVM address
        const receiverAccountId = operatorId
          
            console.log("receiverAccountId", receiverAccountId.toString());
        console.log("Deploying NFT contract...");
        const nftService = new NFTService(client, accountId, privateKey);
        const nftContractId = await nftService.deployNFTContract();
        console.log("NFT contract deployed at:", nftContractId.toString());

        console.log("\nCreating NFT token...");
        const tokenAddress = await nftService.createNft(
            "HederaStays Properties",
            "HSTAY",
            "HederaStays Property Collection",
            1000, // maxSupply
            7776000 // autoRenewPeriod (90 days in seconds)
        );
        console.log("NFT token created at:", tokenAddress);

        // Convert token address to TokenId
        const tokenId = getTokenIdFromEvmAddress(tokenAddress) 
        // Step 1: Mint NFT to contract's wallet
        console.log("\nStep 1: Minting NFT to contract's wallet...");
        const metadata = [Buffer.from("ipfs://test-property-metadata-uri")];
        const now = Math.floor(Date.now() / 1000);
        const availableDates = [
            now + 86400, // Tomorrow
            now + (2 * 86400), // Day after tomorrow
            now + (3 * 86400)  // Three days from now
        ];

        const serialNumber = await nftService.mintNft(
            tokenAddress,
            metadata,
            availableDates
        );
        console.log("NFT minted with serial number:", serialNumber.toString());

        // Step 2: Associate token with receiver's account using Hedera SDK
        console.log("\nStep 2: Associating token with receiver's account...");
        const associateTokenTx = await new TokenAssociateTransaction()
            .setAccountId(receiverAccountId)
            .setTokenIds([tokenId])
            .freezeWith(client)
            .sign(privateKey);

        const associateTokenSubmit = await associateTokenTx.execute(client);
        const associateTokenRx = await associateTokenSubmit.getReceipt(client);
        console.log("Token association status:", associateTokenRx.status.toString());

        // Step 3: Transfer NFT to receiver
        console.log("\nStep 3: Transferring NFT to receiver...");
        await nftService.transferNft(
            tokenAddress,
            receiverAddress,
            serialNumber.toNumber()
        );
        console.log("NFT transferred to:", receiverAddress);

        // Save all deployment information
        const fs = require('fs');
        const deploymentInfo = {
            nftContractId: nftContractId.toString(),
            tokenAddress: tokenAddress,
            tokenId: tokenId.toString(),
            mintedNFTSerialNumber: serialNumber.toString(),
            receiverAddress: receiverAddress,
            receiverAccountId: receiverAccountId.toString(),
            availableDates: availableDates
        };
        fs.writeFileSync('deployment-nft.json', JSON.stringify(deploymentInfo, null, 2));
        console.log("\nDeployment information saved to deployment-nft.json");

        console.log("\nDeployment and minting flow completed successfully!");
    } catch (error) {
        console.error("Error in deployment script:", error);
        process.exit(1);
    }
}

main(); 