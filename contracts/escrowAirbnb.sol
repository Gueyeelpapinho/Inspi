// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// la presentation 
// rapport 
// cr 

import "./nftstays.sol";

contract HederaStaysEscrow {
    NFTCreator public nftContract;
    
    struct Booking {
        address renter;
        address propertyOwner;
        uint256 tokenId;
        uint256 startDate;
        uint256 endDate;
        uint256 amount;
        bool isApproved;
        bool isCompleted;
        bool isCancelled;
    }
    
    mapping(uint256 => Booking) public bookings;
    uint256 public nextBookingId;
    
    event BookingRequested(
        uint256 indexed bookingId,
        uint256 indexed tokenId,
        address renter,
        uint256 startDate,
        uint256 endDate,
        uint256 amount
    );
    
    event BookingApproved(uint256 indexed bookingId);
    event BookingRejected(uint256 indexed bookingId);
    event BookingCompleted(uint256 indexed bookingId);
    
    constructor(address _nftContract) {
        nftContract = NFTCreator(_nftContract);
        nextBookingId = 1;
    }
    
    // Create a booking request
    function requestBooking(
        address tokenAddress,
        uint256 tokenId,
        uint256 startDate,
        uint256 endDate
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment required for booking");
        require(startDate < endDate, "Invalid date range");
        require(startDate > block.timestamp, "Cannot book past dates");
        
        // Check availability for all dates in the range
        for (uint256 date = startDate; date <= endDate; date += 1 days) {
            require(nftContract.isDateAvailable(tokenAddress, int64(uint64(tokenId)), date), 
                "Property not available for selected dates");
        }
        
        // Verify that the token exists and get its owner
        bool isValidToken = nftContract.isOwner(tokenAddress, int64(uint64(tokenId)));
        require(isValidToken, "Invalid token ID");
        
        // The property owner will be verified during approval
        // For now, we'll store the current token owner
        address propertyOwner = msg.sender; // This will be verified during approval
        
        uint256 currentBookingId = nextBookingId;
        
        Booking storage booking = bookings[currentBookingId];
        booking.renter = msg.sender;
        booking.propertyOwner = propertyOwner;
        booking.tokenId = tokenId;
        booking.startDate = startDate;
        booking.endDate = endDate;
        booking.amount = msg.value;
        booking.isApproved = false;
        booking.isCompleted = false;
        booking.isCancelled = false;
        
        emit BookingRequested(
            currentBookingId,
            tokenId,
            msg.sender,
            startDate,
            endDate,
            msg.value
        );
        
        nextBookingId++;
        return currentBookingId;
    }
    
    // Property owner approves booking
    function approveBooking(address tokenAddress,uint256 bookingId) external {
        Booking storage booking = bookings[bookingId];
        
        // Verify that the approver is the current owner of the NFT
        bool isCurrentOwner = nftContract.isOwner(tokenAddress, int64(uint64(booking.tokenId)));
        require(isCurrentOwner, "Only current property owner can approve");
        require(!booking.isApproved && !booking.isCompleted && !booking.isCancelled, "Invalid booking state");
        
        // Update the property owner to the current owner
        booking.propertyOwner = msg.sender;
        
        // Mark dates as booked
        for (uint256 date = booking.startDate; date <= booking.endDate; date += 1 days) {
            nftContract.updateAvailability(tokenAddress, int64(uint64(booking.tokenId)), date, true);
        }
        
        // Transfer payment to property owner
        (bool sent, ) = booking.propertyOwner.call{value: booking.amount}("");
        require(sent, "Failed to send payment");
        
        booking.isApproved = true;
        emit BookingApproved(bookingId);
    }
    
    // Property owner rejects booking
    function rejectBooking(uint256 bookingId) external {
        Booking storage booking = bookings[bookingId];
        require(msg.sender == booking.propertyOwner, "Only property owner can reject");
        require(!booking.isApproved && !booking.isCompleted && !booking.isCancelled, "Invalid booking state");
        
        // Return payment to renter
        (bool sent, ) = booking.renter.call{value: booking.amount}("");
        require(sent, "Failed to return payment");
        
        booking.isCancelled = true;
        emit BookingRejected(bookingId);
    }
    
    // Complete a booking after the stay
    function completeBooking(uint256 bookingId) external {
        Booking storage booking = bookings[bookingId];
        require(
            msg.sender == booking.propertyOwner || msg.sender == booking.renter,
            "Only property owner or renter can complete"
        );
        require(booking.isApproved && !booking.isCompleted && !booking.isCancelled, "Invalid booking state");
        require(block.timestamp > booking.endDate, "Booking period not ended");
        
        booking.isCompleted = true;
        emit BookingCompleted(bookingId);
    }
    
    // View booking details
    function getBooking(uint256 bookingId) external view returns (
        address renter,
        address propertyOwner,
        uint256 tokenId,
        uint256 startDate,
        uint256 endDate,
        uint256 amount,
        bool isApproved,
        bool isCompleted,
        bool isCancelled
    ) {
        Booking storage booking = bookings[bookingId];
        return (
            booking.renter,
            booking.propertyOwner,
            booking.tokenId,
            booking.startDate,
            booking.endDate,
            booking.amount,
            booking.isApproved,
            booking.isCompleted,
            booking.isCancelled
        );
    }
    
    // Fallback function to receive Hbar
    receive() external payable {}
}
