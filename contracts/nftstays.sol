// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import './HederaResponseCodes.sol';
import './IHederaTokenService.sol';
import './HederaTokenService.sol';
import './ExpiryHelper.sol';


contract NFTCreator is ExpiryHelper {
    // Mapping to store property availability
    mapping(address => mapping(int64 => mapping(uint256 => bool))) public propertyAvailability; // token => serialNumber => date => isBooked
    mapping(address => mapping(int64 => uint256[])) public propertyDates; // token => serialNumber => dates array

    function createNft(
            string memory name, 
            string memory symbol, 
            string memory memo, 
            int64 maxSupply,  
            uint32 autoRenewPeriod
        ) external payable returns (address){

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        // Set this contract as supply
        keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));

        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.memo = memo;
        token.treasury = address(this);
        token.tokenSupplyType = true; // set supply to FINITE
        token.maxSupply = maxSupply;
        token.tokenKeys = keys;
        token.freezeDefault = false;
        token.expiry = createAutoRenewExpiry(address(this), autoRenewPeriod); // Contract automatically renew by himself

        (int responseCode, address createdToken) = HederaTokenService.createNonFungibleToken(token);

        if(responseCode != HederaResponseCodes.SUCCESS){
            //revert("Failed to create non-fungible token");
        }
        return createdToken;
    }

    function mintNft(
        address token,
        bytes[] memory metadata,
        uint256[] memory availableDates
    ) external returns(int64){

        (int response, , int64[] memory serial) = HederaTokenService.mintToken(token, 0, metadata);

        if(response != HederaResponseCodes.SUCCESS){
            revert("Failed to mint non-fungible token");
        }

        // Initialize availability for all provided dates
        for (uint256 i = 0; i < availableDates.length; i++) {
            propertyAvailability[token][serial[0]][availableDates[i]] = false; // false means available
            propertyDates[token][serial[0]].push(availableDates[i]);
        }

        return serial[0];
    }

  

    function transferNft(
        address token,
        address receiver, 
        int64 serial
    ) external returns(int){

        HederaTokenService.associateToken(receiver, token);
        int response = HederaTokenService.transferNFT(token, address(this), receiver, serial);

        if(response != HederaResponseCodes.SUCCESS){
            revert("Failed to transfer non-fungible token");
        }

        return response;
    }

    // Check if a date is available for a property
    function isDateAvailable(address token, int64 serialNumber, uint256 date) external view returns (bool) {
        return !propertyAvailability[token][serialNumber][date]; // false means available
    }

    // Update availability for a date
    function updateAvailability(address token, int64 serialNumber, uint256 date, bool isBooked) external {
        // Check if caller is the owner
        (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory tokenInfo) = 
            HederaTokenService.getNonFungibleTokenInfo(token, serialNumber);
            
        require(responseCode == HederaResponseCodes.SUCCESS, "Failed to get token info");
        require(tokenInfo.ownerId == msg.sender, "Only owner can update availability");
        
        propertyAvailability[token][serialNumber][date] = isBooked;
    }

    // Get all dates for a property
    function getAllDates(address token, int64 serialNumber) external view returns (uint256[] memory) {
        return propertyDates[token][serialNumber];
    }

    // Check if caller is the owner of an NFT
    function isOwner(address token, int64 serialNumber) external  returns (bool) {
        (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory tokenInfo) = 
            HederaTokenService.getNonFungibleTokenInfo(token, serialNumber);
            
        if(responseCode != HederaResponseCodes.SUCCESS) {
            return false;
        }
        
        return tokenInfo.ownerId == msg.sender;
    }
}