import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    TransferTransaction,
    AccountCreateTransaction,
    TokenId,
    AccountInfoQuery
} from "@hashgraph/sdk";
import { NFTService } from "../src/services/nftService";
import { EscrowService } from "../src/services/escrowService";
import * as dotenv from "dotenv";

async function createTestAccount(client: Client, initialBalance: number): Promise<{accountId: AccountId, privateKey: PrivateKey}> {
    const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;

    const response = await new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(new Hbar(initialBalance))
        .execute(client);

    const receipt = await response.getReceipt(client);
    const newAccountId = receipt.accountId!;

    console.log(`\nCreated test account: ${newAccountId.toString()}`);
    console.log(`Private key: ${newPrivateKey.toString()}`);
    console.log(`Initial balance: ${initialBalance} HBAR`);

    return {
        accountId: newAccountId,
        privateKey: newPrivateKey
    };
}

async function getAccountBalance(client: Client, accountId: AccountId): Promise<number> {
    const query = new AccountInfoQuery().setAccountId(accountId);
    const accountInfo = await query.execute(client);
    return accountInfo.balance.toBigNumber().toNumber();
}

async function printBookingDetails(escrowService: EscrowService, bookingId: string, bookingLabel: string, expectedStartDate?: number, expectedEndDate?: number) {
    try {
        const bookingDetails = await escrowService.getBooking(bookingId);
        console.log(`\n${bookingLabel} Details:`);
        console.log('- Renter:', bookingDetails.renter);
        console.log('- Property Owner:', bookingDetails.propertyOwner);
        console.log('- Token ID:', bookingDetails.tokenId);
        
        const startDate = new Date(bookingDetails.startDate * 1000);
        const endDate = new Date(bookingDetails.endDate * 1000);
        
        console.log('- Start Date:', startDate.toLocaleString(), `(timestamp: ${bookingDetails.startDate})`);
        console.log('- End Date:', endDate.toLocaleString(), `(timestamp: ${bookingDetails.endDate})`);
        
        if (expectedStartDate && expectedEndDate) {
            console.log('- Date Verification:');
            console.log('  * Expected Start:', new Date(expectedStartDate * 1000).toLocaleString(), `(timestamp: ${expectedStartDate})`);
            console.log('  * Expected End:', new Date(expectedEndDate * 1000).toLocaleString(), `(timestamp: ${expectedEndDate})`);
            console.log('  * Dates Match:', 
                bookingDetails.startDate === expectedStartDate && 
                bookingDetails.endDate === expectedEndDate ? 'Yes ✓' : 'No ✗');
        }

        console.log('- Amount:', bookingDetails.amount, 'tinybar');
        console.log('- Status:');
        console.log('  * Approved:', bookingDetails.isApproved ? 'Yes ✓' : 'No ✗');
        console.log('  * Completed:', bookingDetails.isCompleted ? 'Yes ✓' : 'No ✗');
        console.log('  * Cancelled:', bookingDetails.isCancelled ? 'Yes ✓' : 'No ✗');
    } catch (error) {
        console.error(`Error fetching ${bookingLabel} details:`, error);
    }
}

async function verifyDateAvailability(nftService: NFTService, tokenAddress: string, serialNumber: number, date: number): Promise<boolean> {
    try {
        const isAvailable = await nftService.isDateAvailable(tokenAddress, serialNumber, date);
        console.log(`Date ${new Date(date * 1000).toLocaleString()} availability:`, isAvailable ? 'Available ✓' : 'Not Available ✗');
        return isAvailable;
    } catch (error) {
        console.error('Error checking date availability:', error);
        return false;
    }
}

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

        // Create Hedera client
        const client = Client.forTestnet();
        const mainAccountId = AccountId.fromString(operatorId);
        const mainPrivateKey = PrivateKey.fromString(operatorKey);
        client.setOperator(mainAccountId, mainPrivateKey);

        console.log("\n=== Creating Test Accounts ===");
        // Create two test accounts: one for guest1 and one for guest2
        const guest1 = await createTestAccount(client, 50); // 50 HBAR initial balance
        const guest2 = await createTestAccount(client, 50);

        console.log("\n=== Deploying NFT Contract ===");
        const nftService = new NFTService(client, mainAccountId, mainPrivateKey);
        const nftContractId = await nftService.deployNFTContract();
        console.log("NFT contract deployed at:", nftContractId.toString());

        console.log("\n=== Creating NFT Token ===");
        const tokenAddress = await nftService.createNft(
            "Test Property",
            "TPROP",
            "Test Property Collection",
            1000,
            7776000
        );
        console.log("NFT token created at:", tokenAddress);
        const tokenId = TokenId.fromSolidityAddress(tokenAddress);

        console.log("\n=== Minting NFT ===");
        const metadata = [Buffer.from("ipfs://test-property-metadata-uri")];
        const now = Math.floor(Date.now() / 1000);
        const availableDates = [
            now + 86400,    // Tomorrow
            now + 172800,   // Day after tomorrow
            now + 259200    // Three days from now
        ];

        const serialNumber = await nftService.mintNft(
            tokenAddress,
            metadata,
            availableDates
        );
        console.log("NFT minted with serial number:", serialNumber.toString());

        console.log("\n=== Deploying Escrow Contract ===");
        const escrowService = new EscrowService(client, mainAccountId, mainPrivateKey);
        const escrowContractId = await escrowService.deployEscrowContract(tokenAddress);
        console.log("Escrow contract deployed at:", escrowContractId.toString());

        // Book dates for both guests
        console.log("\n=== Guest 1 Booking Process ===");
        const guest1Date = availableDates[0];
        const guest1EndDate = guest1Date + 86400; // One day stay
        console.log(`Guest 1 attempting to book dates:`);
        console.log(`- Start: ${new Date(guest1Date * 1000).toLocaleString()}`);
        console.log(`- End: ${new Date(guest1EndDate * 1000).toLocaleString()}`);

        // Verify date availability before booking
        console.log('\nChecking date availability for Guest 1:');
        await verifyDateAvailability(nftService, tokenAddress, serialNumber.toNumber(), guest1Date);
        
        const guest1BookingId = await escrowService.requestBooking(
            tokenAddress,
            serialNumber.toNumber(),
            guest1Date,
            guest1EndDate
        );
        console.log(`\nGuest 1 booking completed. Booking ID: ${guest1BookingId}`);
        
        // Check Guest 1's booking details after request
        await printBookingDetails(escrowService, guest1BookingId.toString(), "Guest 1's Initial Booking", guest1Date, guest1EndDate);

        console.log("\n=== Guest 2 Booking Process ===");
        const guest2Date = availableDates[1];
        const guest2EndDate = guest2Date + 86400; // One day stay
        console.log(`Guest 2 attempting to book dates:`);
        console.log(`- Start: ${new Date(guest2Date * 1000).toLocaleString()}`);
        console.log(`- End: ${new Date(guest2EndDate * 1000).toLocaleString()}`);

        // Verify date availability before booking
        console.log('\nChecking date availability for Guest 2:');
        await verifyDateAvailability(nftService, tokenAddress, serialNumber.toNumber(), guest2Date);

        const guest2BookingId = await escrowService.requestBooking(
            tokenAddress,
            serialNumber.toNumber(),
            guest2Date,
            guest2EndDate
        );
        console.log(`\nGuest 2 booking completed. Booking ID: ${guest2BookingId}`);

        // Check Guest 2's booking details after request
        await printBookingDetails(escrowService, guest2BookingId.toString(), "Guest 2's Initial Booking", guest2Date, guest2EndDate);

        // Owner approves Guest 1's booking
        console.log("\n=== Owner Approving Guest 1's Booking ===");
        await escrowService.approveBooking(tokenAddress, guest1BookingId);
        console.log("Guest 1's booking approved by owner");

        // Verify date is now marked as booked
        console.log('\nVerifying Guest 1 date is now booked:');
        await verifyDateAvailability(nftService, tokenAddress, serialNumber.toNumber(), guest1Date);

        // Check Guest 1's booking details after approval
        await printBookingDetails(escrowService, guest1BookingId.toString(), "Guest 1's Booking After Approval", guest1Date, guest1EndDate);

        // Owner rejects Guest 2's booking
        console.log("\n=== Owner Rejecting Guest 2's Booking ===");
        await escrowService.rejectBooking(guest2BookingId.toString());
        console.log("Guest 2's booking rejected by owner");

        // Verify date is still available after rejection
        console.log('\nVerifying Guest 2 date is still available after rejection:');
        await verifyDateAvailability(nftService, tokenAddress, serialNumber.toNumber(), guest2Date);

        // Check Guest 2's booking details after rejection
        await printBookingDetails(escrowService, guest2BookingId.toString(), "Guest 2's Booking After Rejection", guest2Date, guest2EndDate);

        // Check final balances
        console.log("\n=== Final Account Balances ===");
        const guest1FinalBalance = await getAccountBalance(client, guest1.accountId);
        const guest2FinalBalance = await getAccountBalance(client, guest2.accountId);
        const ownerFinalBalance = await getAccountBalance(client, mainAccountId);

        console.log(`Guest 1 final balance: ${guest1FinalBalance} HBAR`);
        console.log(`Guest 2 final balance: ${guest2FinalBalance} HBAR`);
        console.log(`Owner final balance: ${ownerFinalBalance} HBAR`);

        // Save test information
        const fs = require('fs');
        const testInfo = {
            nftContractId: nftContractId.toString(),
            escrowContractId: escrowContractId.toString(),
            tokenAddress: tokenAddress,
            tokenId: tokenId.toString(),
            nftSerialNumber: serialNumber.toString(),
            guest1: {
                accountId: guest1.accountId.toString(),
                privateKey: guest1.privateKey.toString(),
                bookingId: guest1BookingId.toString(),
                bookedDate: guest1Date,
                endDate: guest1EndDate
            },
            guest2: {
                accountId: guest2.accountId.toString(),
                privateKey: guest2.privateKey.toString(),
                bookingId: guest2BookingId.toString(),
                bookedDate: guest2Date,
                endDate: guest2EndDate
            },
            availableDates: availableDates
        };
        fs.writeFileSync('escrow-test-info.json', JSON.stringify(testInfo, null, 2));
        console.log("\nTest information saved to escrow-test-info.json");

        console.log("\n=== Test Scenario Completed Successfully ===");
    } catch (error) {
        console.error("\nError in test script:", error);
        process.exit(1);
    }
}

main(); 