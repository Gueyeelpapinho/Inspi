import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { EscrowService } from "../src/services/escrowService";
import * as dotenv from "dotenv";

async function main() {
    try {
        // Load environment variables
        dotenv.config();

        // Check for environment variables
        const operatorId = process.env.OPERATOR_ID;
        const operatorKey = process.env.OPERATOR_KEY;

        if (!operatorId || !operatorKey) {
            throw new Error("Environment variables OPERATOR_ID and OPERATOR_KEY must be present");
        }

        // NFT Contract information
        const nftContractAddress = "000000000000000000000000000000000069a73f"; // EVM address of the NFT contract

        // Create Hedera client
        const client = Client.forTestnet();
        const accountId = AccountId.fromString(operatorId);
        const privateKey = PrivateKey.fromString(operatorKey);
        client.setOperator(accountId, privateKey);

        console.log("Deploying Escrow contract...");
        console.log("Using NFT contract address:", nftContractAddress);
        
        const escrowService = new EscrowService(client, accountId, privateKey);
        const escrowContractId = await escrowService.deployEscrowContract(nftContractAddress);
        console.log("Escrow contract deployed at:", escrowContractId.toString());

        console.log("\nTesting booking request...");
        await escrowService.testRequestBooking(nftContractAddress);

        console.log("\nDeployment and test completed successfully!");
    } catch (error) {
        console.error("Error in deployment script:", error);
        process.exit(1);
    }
}

main(); 