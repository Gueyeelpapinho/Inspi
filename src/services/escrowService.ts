import {
    AccountId,
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    FileCreateTransaction,
    Hbar,
    Client,
    PrivateKey,
    ContractCallQuery,
    Long,
} from "@hashgraph/sdk";
import * as fs from 'fs';
import * as path from 'path';

export interface BookingDetails {
    renter: string;
    propertyOwner: string;
    tokenId: string;
    startDate: number;
    endDate: number;
    amount: number;
    isApproved: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
}

export class EscrowService {
    private client: Client;
    private contractId!: ContractId;
    private operatorId: AccountId;
    private operatorKey: PrivateKey;

    constructor(client: Client, operatorId: AccountId, operatorKey: PrivateKey) {
        this.client = client;
        this.operatorId = operatorId;
        this.operatorKey = operatorKey;
    }

    // Deploy the Escrow contract
    async deployEscrowContract(nftContractAddress: string): Promise<ContractId> {
        try {
            // Read the contract bytecode
            const bytecode = fs.readFileSync(
                path.join(process.cwd(), 'contracts/build/contracts_escrowAirbnb_sol_HederaStaysEscrow.bin')
            ).toString();

            const createContract = new ContractCreateFlow()
                .setGas(8000000)
                .setBytecode(bytecode)
                .setConstructorParameters(
                    new ContractFunctionParameters().addAddress(nftContractAddress)
                );

            const createContractTx = await createContract.execute(this.client);
            const createContractRx = await createContractTx.getReceipt(this.client);
            
            if (!createContractRx.contractId) {
                throw new Error("Failed to create escrow contract - no contract ID received");
            }
            this.contractId = createContractRx.contractId;

            return this.contractId;
        } catch (error) {
            console.error("Error deploying escrow contract:", error);
            throw error;
        }
    }

    // Request a booking
    async requestBooking(
        tokenAddress: string,
        tokenId: number,
        startDate: number,
        endDate: number
    ): Promise<number> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setPayableAmount(new Hbar(0.01)) // 0.01 HBAR for testing
                .setFunction(
                    "requestBooking",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addUint256(tokenId)
                        .addUint256(startDate)
                        .addUint256(endDate)
                );

            const txResponse = await transaction.execute(this.client);
            const record = await txResponse.getRecord(this.client);
            
            if (!record.contractFunctionResult) {
                throw new Error("Failed to request booking - no function result received");
            }
            
            const bookingId = record.contractFunctionResult.getUint256(0);
            return bookingId.toNumber();
        } catch (error) {
            console.error("Error requesting booking:", error);
            throw error;
        }
    }

    // Example test function
    async testRequestBooking(tokenAddress: string): Promise<void> {
        try {
            // Get current timestamp and add some time for start/end dates
            const now = Math.floor(Date.now() / 1000);
            const startDate = now + 86400; // Start tomorrow
            const endDate = now + (2 * 86400); // End day after tomorrow
            
            // Test with token ID 1
            const bookingId = await this.requestBooking(
                tokenAddress,
                1, // tokenId
                startDate,
                endDate
            );
            console.log("Booking requested successfully! Booking ID:", bookingId);
            
        } catch (error) {
            console.error("Error testing booking request:", error);
            throw error;
        }
    }

    // Approve a booking
    async approveBooking(
        tokenAddress: string,
        bookingId: number
    ): Promise<void> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "approveBooking",
                    new ContractFunctionParameters()
                        .addAddress(tokenAddress)
                        .addUint256(bookingId)
                );

            await transaction.execute(this.client);
        } catch (error) {
            console.error("Error approving booking:", error);
            throw error;
        }
    }

    // Reject a booking
    async rejectBooking(bookingId: string): Promise<void> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "rejectBooking",
                    new ContractFunctionParameters()
                        .addUint256(Long.fromString(bookingId))
                );

            await transaction.execute(this.client);
        } catch (error) {
            console.error("Error rejecting booking:", error);
            throw error;
        }
    }

    // Complete a booking
    async completeBooking(bookingId: string): Promise<void> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    "completeBooking",
                    new ContractFunctionParameters()
                        .addUint256(Long.fromString(bookingId))
                );

            await transaction.execute(this.client);
        } catch (error) {
            console.error("Error completing booking:", error);
            throw error;
        }
    }

    // Get booking details
    async getBooking(bookingId: string): Promise<BookingDetails> {
        try {
            if (!this.contractId) {
                throw new Error("Contract not deployed");
            }

            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "getBooking",
                    new ContractFunctionParameters()
                        .addUint256(Long.fromString(bookingId))
                );

            const response = await query.execute(this.client);
            
            return {
                renter: response.getAddress(0),
                propertyOwner: response.getAddress(32), // Addresses are 32 bytes
                tokenId: response.getUint256(64).toString(),
                startDate: response.getUint256(96).toNumber(),
                endDate: response.getUint256(128).toNumber(),
                amount: response.getUint256(160).toNumber(),
                isApproved: response.getBool(192),
                isCompleted: response.getBool(193),
                isCancelled: response.getBool(194)
            };
        } catch (error) {
            console.error("Error getting booking details:", error);
            throw error;
        }
    }
}

// Example usage:
/*
const initializeEscrowService = async () => {
    // Initialize your Hedera client
    const client = Client.forTestnet();
    
    // Configure your operator account
    const operatorId = AccountId.fromString("YOUR_OPERATOR_ID");
    const operatorKey = PrivateKey.fromString("YOUR_OPERATOR_PRIVATE_KEY");
    client.setOperator(operatorId, operatorKey);
    
    // Create escrow service instance
    const escrowService = new EscrowService(client, operatorId, operatorKey);
    
    // Deploy contract (assuming you have already deployed the NFT contract)
    const nftContractAddress = "YOUR_NFT_CONTRACT_ADDRESS";
    const contractId = await escrowService.deployEscrowContract(nftContractAddress);
    console.log("Escrow contract deployed at:", contractId.toString());
    
    // Test booking request
    await escrowService.testRequestBooking(nftContractAddress);
}
*/ 