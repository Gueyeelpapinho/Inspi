# HederaAirbnb Smart Contracts Documentation

This repository contains the smart contracts for HederaAirbnb, a decentralized property rental platform built on the Hedera blockchain. The system uses NFTs to represent properties and implements an escrow mechanism for secure booking transactions.

## 📋 Table of Contents

- [Contract Overview](#contract-overview)
- [Core Contracts](#core-contracts)
- [Helper Contracts](#helper-contracts)
- [Contract Architecture](#contract-architecture)
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)
- [Security Considerations](#security-considerations)

## 🏗️ Contract Overview

The HederaAirbnb platform consists of two main contracts and several helper contracts:

### Core Contracts
1. **NFTCreator** (`nftstays.sol`) - Manages property NFTs and availability
2. **HederaStaysEscrow** (`escrowAirbnb.sol`) - Handles booking transactions and escrow

### Helper Contracts
3. **HederaTokenService** - Interface to Hedera Token Service
4. **ExpiryHelper** - Manages token expiry settings
5. **FeeHelper** - Handles fee structures
6. **KeyHelper** - Manages cryptographic keys
7. **HederaResponseCodes** - Response code definitions
8. **IHederaTokenService** - Interface definitions

---

## 🏠 Core Contracts

### 1. NFTCreator Contract (`nftstays.sol`)

**Purpose**: Creates and manages property NFTs with availability tracking.

#### Key Features:
- **NFT Creation**: Creates non-fungible tokens representing properties
- **Availability Management**: Tracks which dates are available/booked for each property
- **Ownership Verification**: Verifies property ownership for operations
- **Date Management**: Manages available dates for property rentals

#### Main Functions:

```solidity
// Create a new property NFT
function createNft(
    string memory name,
    string memory symbol, 
    string memory memo,
    int64 maxSupply,
    uint32 autoRenewPeriod
) external payable returns (address)
```

```solidity
// Mint a property NFT with available dates
function mintNft(
    address token,
    bytes[] memory metadata,
    uint256[] memory availableDates
) external returns(int64)
```

```solidity
// Check if a date is available for booking
function isDateAvailable(
    address token, 
    int64 serialNumber, 
    uint256 date
) external view returns (bool)
```

```solidity
// Update availability status for a date
function updateAvailability(
    address token,
    int64 serialNumber,
    uint256 date,
    bool isBooked
) external
```

#### Data Structures:
- `propertyAvailability`: Maps token → serial → date → booking status
- `propertyDates`: Maps token → serial → array of available dates

---

### 2. HederaStaysEscrow Contract (`escrowAirbnb.sol`)

**Purpose**: Manages booking transactions, payments, and escrow functionality.

#### Key Features:
- **Booking Requests**: Allows renters to request property bookings
- **Escrow Management**: Holds payments until booking approval/completion
- **Owner Approval**: Property owners can approve or reject bookings
- **Automatic Refunds**: Returns payments for rejected bookings
- **Booking Lifecycle**: Tracks booking states from request to completion

#### Booking States:
- `Requested`: Initial booking request with payment held in escrow
- `Approved`: Owner approved, payment released, dates marked as booked
- `Rejected`: Owner rejected, payment refunded to renter
- `Completed`: Stay completed, booking finalized
- `Cancelled`: Booking cancelled

#### Main Functions:

```solidity
// Request a booking with payment
function requestBooking(
    address tokenAddress,
    uint256 tokenId,
    uint256 startDate,
    uint256 endDate
) external payable returns (uint256)
```

```solidity
// Property owner approves booking
function approveBooking(
    address tokenAddress,
    uint256 bookingId
) external
```

```solidity
// Property owner rejects booking
function rejectBooking(uint256 bookingId) external
```

```solidity
// Complete booking after stay
function completeBooking(uint256 bookingId) external
```

#### Data Structures:
```solidity
struct Booking {
    address renter;          // Who made the booking
    address propertyOwner;   // Property owner
    uint256 tokenId;         // Property NFT ID
    uint256 startDate;       // Check-in date (timestamp)
    uint256 endDate;         // Check-out date (timestamp)
    uint256 amount;          // Payment amount in HBAR
    bool isApproved;         // Owner approval status
    bool isCompleted;        // Completion status
    bool isCancelled;        // Cancellation status
}
```

#### Events:
```solidity
event BookingRequested(uint256 indexed bookingId, uint256 indexed tokenId, address renter, uint256 startDate, uint256 endDate, uint256 amount);
event BookingApproved(uint256 indexed bookingId);
event BookingRejected(uint256 indexed bookingId);
event BookingCompleted(uint256 indexed bookingId);
```

---

## 🔧 Helper Contracts

### 3. HederaTokenService (`HederaTokenService.sol`)

**Purpose**: Abstract contract providing interface to Hedera Token Service precompiled contract.

**Key Features**:
- Token creation and management
- NFT minting and transfers
- Token association and dissociation
- Balance queries and token info retrieval

**Important Constants**:
- `precompileAddress`: `0x167` (Hedera Token Service precompile)
- `defaultAutoRenewPeriod`: 90 days (7776000 seconds)

### 4. ExpiryHelper (`ExpiryHelper.sol`)

**Purpose**: Manages token expiry configurations.

**Functions**:
```solidity
// Create auto-renew expiry configuration
function createAutoRenewExpiry(
    address autoRenewAccount,
    uint32 autoRenewPeriod
) internal view returns (IHederaTokenService.Expiry memory)

// Create second-based expiry
function createSecondExpiry(uint32 second) internal view returns (IHederaTokenService.Expiry memory)
```

### 5. FeeHelper (`FeeHelper.sol`)

**Purpose**: Manages fee structures for tokens.

**Fee Types**:
- **Fixed HBAR Fee**: Fixed amount in HBAR
- **Fixed Token Fee**: Fixed amount in specific token
- **Fractional Fee**: Percentage-based fee
- **Royalty Fee**: NFT royalty fees

### 6. KeyHelper (`KeyHelper.sol`)

**Purpose**: Manages cryptographic keys for token operations.

**Key Types**:
- `ADMIN`: Administrative operations
- `KYC`: Know Your Customer operations
- `FREEZE`: Freeze/unfreeze operations
- `WIPE`: Token wipe operations
- `SUPPLY`: Supply management operations
- `FEE`: Fee collection operations
- `PAUSE`: Pause/unpause operations

### 7. HederaResponseCodes (`HederaResponseCodes.sol`)

**Purpose**: Defines response codes for Hedera operations.

**Key Response Codes**:
- `SUCCESS = 22`: Operation successful
- `INVALID_TOKEN_ID`: Token doesn't exist
- `INSUFFICIENT_ACCOUNT_BALANCE`: Not enough balance
- `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`: Token not associated

### 8. IHederaTokenService (`IHederaTokenService.sol`)

**Purpose**: Interface definitions for Hedera Token Service operations.

**Key Structures**:
- `HederaToken`: Token configuration
- `TokenKey`: Cryptographic key configuration
- `Expiry`: Token expiry settings
- `FixedFee`, `FractionalFee`, `RoyaltyFee`: Fee structures

---

## 🏛️ Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HederaAirbnb Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌──────────────────────────┐   │
│  │   NFTCreator    │◄────────┤   HederaStaysEscrow      │   │
│  │   (nftstays)    │         │   (escrowAirbnb)         │   │
│  │                 │         │                          │   │
│  │ • Create NFTs   │         │ • Booking Management     │   │
│  │ • Manage Dates  │         │ • Escrow Services        │   │
│  │ • Availability  │         │ • Payment Processing     │   │
│  └─────────────────┘         └──────────────────────────┘   │
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐   │
│  │              Helper Contracts                        │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │   │
│  │ │ExpiryHelper │ │ FeeHelper   │ │   KeyHelper     │  │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘  │   │
│  │                                                      │   │
│  │ ┌─────────────────────────────────────────────────┐  │   │
│  │ │         HederaTokenService                      │  │   │
│  │ │    (Interface to Hedera Precompile)            │  │   │
│  │ └─────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment

### Prerequisites
- Node.js and npm
- Hardhat development environment
- Hedera testnet/mainnet account
- HBAR for deployment costs

### Deployment Steps

1. **Deploy NFTCreator Contract**:
   ```bash
   npx hardhat run scripts/deployNFT.ts --network testnet
   ```

2. **Deploy Escrow Contract**:
   ```bash
   npx hardhat run scripts/deployEscrow.ts --network testnet
   ```

### Configuration Files
- `deployment-nft.json`: NFT contract deployment info
- `escrow-test-info.json`: Escrow contract deployment info

---

## 💡 Usage Examples

### Creating a Property NFT

```javascript
// 1. Create NFT collection
const tokenAddress = await nftCreator.createNft(
    "HederaStays Properties",
    "HSP",
    "Property rental NFTs",
    1000, // max supply
    7776000 // auto-renew period (90 days)
);

// 2. Mint property NFT with available dates
const availableDates = [
    1704067200, // Jan 1, 2024
    1704153600, // Jan 2, 2024
    1704240000  // Jan 3, 2024
];

const serialNumber = await nftCreator.mintNft(
    tokenAddress,
    ["Property metadata"],
    availableDates
);
```

### Making a Booking

```javascript
// 1. Request booking with payment
const bookingId = await escrow.requestBooking(
    tokenAddress,
    serialNumber,
    1704067200, // start date
    1704153600, // end date
    { value: ethers.utils.parseEther("100") } // payment in HBAR
);

// 2. Property owner approves booking
await escrow.connect(propertyOwner).approveBooking(
    tokenAddress,
    bookingId
);

// 3. Complete booking after stay
await escrow.completeBooking(bookingId);
```

### Checking Availability

```javascript
// Check if a date is available
const isAvailable = await nftCreator.isDateAvailable(
    tokenAddress,
    serialNumber,
    1704067200 // date to check
);

// Get all available dates
const allDates = await nftCreator.getAllDates(
    tokenAddress,
    serialNumber
);
```

---

## 🔒 Security Considerations

### Access Control
- **Property Ownership**: Only NFT owners can approve bookings and update availability
- **Booking Management**: Only renters and property owners can complete bookings
- **Payment Security**: Funds held in escrow until booking approval

### Validation Checks
- **Date Validation**: Prevents booking past dates or invalid date ranges
- **Availability Verification**: Ensures dates are available before booking
- **Payment Requirements**: Requires payment for booking requests
- **State Management**: Prevents invalid state transitions

### Potential Risks
- **Reentrancy**: Use of `call` for payments (mitigated by state checks)
- **Front-running**: Booking requests could be front-run
- **Oracle Dependency**: Time-based operations rely on block timestamps

### Best Practices
- Always check return values from Hedera operations
- Validate all input parameters
- Use events for off-chain monitoring
- Implement proper error handling
- Consider upgradeability patterns for future improvements

---

## 📝 License

- Core contracts (`escrowAirbnb.sol`, `nftstays.sol`): MIT License
- Helper contracts: Apache-2.0 and GPL-3.0 (see individual files)

---

## 🤝 Contributing

When contributing to the smart contracts:

1. Follow Solidity best practices
2. Add comprehensive tests for new functionality
3. Update documentation for any changes
4. Ensure gas optimization
5. Maintain backward compatibility when possible

---

## 📞 Support

For questions about the smart contracts:
- Review the code comments and documentation
- Check the test files for usage examples
- Refer to Hedera documentation for HTS-specific operations

---

*This documentation covers all smart contracts in the HederaAirbnb platform. For frontend integration examples, see the main project README.*