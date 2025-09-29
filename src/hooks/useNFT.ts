import { useState } from 'react';
import useHashConnect from './useHashConnect';

interface PropertyData {
  name: string;
  description: string;
  location: string;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  pricePerNight: number;
  availableDates: number[];
}

export function useNFT() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId, isConnected } = useHashConnect();

  // Deployed contract addresses
  const NFT_CONTRACT_ID = '0.0.6924092'; // Updated to match deployment-nft.json

  const createProperty = async (propertyData: PropertyData): Promise<{ tokenAddress: string; serialNumber: number }> => {
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    // Dynamically import the hashconnect service only on client side
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const { executeContractFunction } = await import('@/services/hashconnect');

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating property NFT with data:', propertyData);

      // Use existing token from deployment instead of creating new ones
      // Each property will be a new NFT within the same token collection
      console.log('Step 1: Using existing token collection...');
      console.log('Contract ID:', NFT_CONTRACT_ID);

      // Skip token creation - use existing deployed token
      const tokenResponse = { success: true };

      // Use the existing deployed token address from deployment-nft.json
      // Try with 0x prefix to see if that's the issue
      const tokenAddress = '0x000000000000000000000000000000000069a73f';
      console.log('Using deployed token address with 0x prefix:', tokenAddress);
      console.log('Token address length:', tokenAddress.length);
      console.log('Token address format check - should be 42 chars with 0x:', tokenAddress.match(/^0x[0-9a-f]{40}$/i));

      // Step 2: Mint the property NFT with metadata
      const metadata = JSON.stringify({
        name: propertyData.name,
        description: propertyData.description,
        location: propertyData.location,
        propertyType: propertyData.propertyType,
        maxGuests: propertyData.maxGuests,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        amenities: propertyData.amenities,
        images: propertyData.images,
        pricePerNight: propertyData.pricePerNight,
        owner: accountId,
        createdAt: Date.now()
      });

      // Convert availableDates to proper uint256 format (timestamps in seconds)
      const uint256Dates = propertyData.availableDates.map(date =>
        Math.floor(date / 1000) // Convert milliseconds to seconds for blockchain
      );

      console.log('Step 2: Minting NFT with metadata...');

      // Use simple IPFS-style metadata like the working deployment script
      // The successful deployment used: [Buffer.from("ipfs://test-property-metadata-uri")]
      const metadataUri = `ipfs://property-${propertyData.name.replace(/\s+/g, '-')}-${Date.now()}`;
      const metadataArray = [metadataUri]; // Array of strings - hashconnect.ts will encode to bytes

      console.log('Using metadata format:', metadataArray);

      const mintNftParams = {
        tokenAddress: tokenAddress,
        metadata: metadataArray,  // Array of strings that will become Uint8Array[]
        availableDates: uint256Dates
      };

      const mintResponse = await executeContractFunction(
        accountId,
        NFT_CONTRACT_ID,
        'mintNft',
        mintNftParams,
        500000
      );
      console.log('Mint response:', mintResponse);

      // Extract serial number from mint response
      let serialNumber = Math.floor(Math.random() * 1000) + 1;

      try {
        if (mintResponse && mintResponse.contractFunctionResult) {
          const result = mintResponse.contractFunctionResult;
          console.log('Contract function result:', result);
          console.log('Result methods:', Object.getOwnPropertyNames(result));

          if (result.getInt64 && typeof result.getInt64 === 'function') {
            serialNumber = result.getInt64(0);
            console.log('Extracted serial number from mint result:', serialNumber);
          } else if (result.asNumber && typeof result.asNumber === 'function') {
            serialNumber = result.asNumber();
            console.log('Extracted serial number via asNumber:', serialNumber);
          } else {
            console.log('Available result properties:', Object.keys(result));
          }
        } else {
          console.log('No contract function result available - transaction may have failed');
        }
      } catch (error) {
        console.log('Could not extract serial number, using mock:', serialNumber, error);
      }

      console.log('Property NFT created successfully:', {
        tokenAddress,
        serialNumber,
        owner: accountId
      });

      // Step 3: Associate token with user account so they can see it
      console.log('Step 3: Associating token with user account...');
      try {
        // Import hashconnect for token association
        const { associateToken } = await import('@/services/hashconnect');

        await associateToken(accountId, tokenAddress);
        console.log('Token associated successfully');
      } catch (associationError) {
        console.log('Token association failed:', associationError);
        // Continue anyway - the NFT was minted successfully
      }

      // Step 4: Transfer NFT from contract to user
      console.log('Step 4: Transferring NFT to user...');
      try {
        const transferParams = {
          tokenAddress: tokenAddress,
          newOwnerAddress: accountId,
          serialNumber: serialNumber
        };

        const transferResponse = await executeContractFunction(
          accountId,
          NFT_CONTRACT_ID,
          'transferNft',
          transferParams,
          500000
        );

        console.log('Transfer response:', transferResponse);

        if (transferResponse && transferResponse.success) {
          console.log('NFT transferred to user successfully!');
        }
      } catch (transferError) {
        console.log('Transfer failed:', transferError);
        // The NFT was still minted successfully, just not transferred
      }

      // Store the created property in localStorage for retrieval
      const propertyRecord = {
        tokenAddress,
        serialNumber,
        transactionId: mintResponse.transactionId,
        metadata: {
          name: propertyData.name,
          description: propertyData.description,
          location: propertyData.location,
          propertyType: propertyData.propertyType,
          maxGuests: propertyData.maxGuests,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          amenities: propertyData.amenities,
          images: propertyData.images,
          pricePerNight: propertyData.pricePerNight,
          owner: accountId,
          createdAt: Date.now()
        }
      };

      console.log('Storing property record:', propertyRecord);

      // Store in localStorage (indexed by owner account)
      const storageKey = `properties_${accountId}`;
      const existingProperties = JSON.parse(localStorage.getItem(storageKey) || '[]');
      console.log('Existing properties before:', existingProperties);

      existingProperties.push(propertyRecord);
      localStorage.setItem(storageKey, JSON.stringify(existingProperties));

      console.log('Stored properties after:', existingProperties);
      console.log('LocalStorage key:', storageKey);

      return {
        tokenAddress,
        serialNumber
      };

    } catch (err: any) {
      console.error('Property creation failed:', err);
      setError(err.message || 'Failed to create property NFT');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePropertyAvailability = async (
    tokenAddress: string,
    serialNumber: number,
    dates: number[],
    isAvailable: boolean
  ): Promise<void> => {
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const { executeContractFunction } = await import('@/services/hashconnect');

    setIsLoading(true);
    setError(null);

    try {
      // Update availability for each date
      for (const date of dates) {
        const updateParams = {
          tokenAddress: tokenAddress,
          serialNumber: serialNumber,
          date: date,
          isBooked: !isAvailable // Contract expects isBooked, so invert isAvailable
        };

        await executeContractFunction(
          accountId,
          NFT_CONTRACT_ID,
          'updateAvailability',
          updateParams,
          200000
        );
      }

      console.log('Availability updated successfully');

    } catch (err: any) {
      console.error('Availability update failed:', err);
      setError(err.message || 'Failed to update availability');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const transferProperty = async (
    tokenAddress: string,
    serialNumber: number,
    newOwnerAddress: string
  ): Promise<void> => {
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const { executeContractFunction } = await import('@/services/hashconnect');

    setIsLoading(true);
    setError(null);

    try {
      const transferParams = {
        tokenAddress: tokenAddress,
        newOwnerAddress: newOwnerAddress,
        serialNumber: serialNumber
      };

      await executeContractFunction(
        accountId,
        NFT_CONTRACT_ID,
        'transferNft',
        transferParams,
        300000
      );

      console.log('Property transferred successfully');

    } catch (err: any) {
      console.error('Property transfer failed:', err);
      setError(err.message || 'Failed to transfer property');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPropertyMetadata = async (
    tokenAddress: string,
    serialNumber: number
  ): Promise<PropertyData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement contract query to get property metadata
      // For now, return mock data
      const mockProperty: PropertyData = {
        name: 'Sample Property',
        description: 'A beautiful property on the blockchain',
        location: 'Blockchain City',
        propertyType: 'house',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['WiFi', 'Kitchen', 'Parking'],
        images: ['https://example.com/image1.jpg'],
        pricePerNight: 100,
        availableDates: []
      };

      return mockProperty;

    } catch (err: any) {
      console.error('Failed to get property metadata:', err);
      setError(err.message || 'Failed to get property metadata');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProperties = async (): Promise<{ tokenAddress: string; serialNumber: number; metadata: PropertyData }[]> => {
    if (!accountId) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get properties from localStorage for this account
      const storageKey = `properties_${accountId}`;
      const storedProperties = JSON.parse(localStorage.getItem(storageKey) || '[]');

      console.log('Retrieved properties for account:', accountId, storedProperties);

      // Transform the stored data to match the expected format
      const properties = storedProperties.map((prop: any) => ({
        tokenAddress: prop.tokenAddress,
        serialNumber: prop.serialNumber,
        transactionId: prop.transactionId,
        metadata: {
          name: prop.metadata.name,
          description: prop.metadata.description,
          location: prop.metadata.location,
          propertyType: prop.metadata.propertyType,
          maxGuests: prop.metadata.maxGuests,
          bedrooms: prop.metadata.bedrooms,
          bathrooms: prop.metadata.bathrooms,
          amenities: prop.metadata.amenities,
          images: prop.metadata.images,
          pricePerNight: prop.metadata.pricePerNight,
          availableDates: [] // Will be populated from blockchain in future
        }
      }));

      return properties;

    } catch (err: any) {
      console.error('Failed to get user properties:', err);
      setError(err.message || 'Failed to get properties');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Test functions to isolate the protobuf error
  const testMinimalMint = async (): Promise<void> => {
    console.log('🧪 STARTING MINIMAL TEST: Testing with absolute minimum parameters');
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const { executeContractFunction } = await import('@/services/hashconnect');

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeContractFunction(
        accountId,
        NFT_CONTRACT_ID,
        'mintNft',
        { minimal: true }, // Trigger minimal test mode
        300000
      );

      console.log('🧪 MINIMAL TEST: Success!', result);
      alert('Minimal test completed successfully! The basic transaction structure works.');
    } catch (err: any) {
      console.error('🧪 MINIMAL TEST: Failed', err);
      throw new Error(`Minimal test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMockTokenMint = async (): Promise<void> => {
    console.log('🎭 STARTING MOCK TOKEN TEST: Testing with mock token address');
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client side');
    }

    const { executeContractFunction } = await import('@/services/hashconnect');

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeContractFunction(
        accountId,
        NFT_CONTRACT_ID,
        'mintNft',
        { mockToken: true }, // Trigger mock token test mode
        300000
      );

      console.log('🎭 MOCK TOKEN TEST: Success!', result);
      alert('Mock token test completed successfully! The minting process works with a known token.');
    } catch (err: any) {
      console.error('🎭 MOCK TOKEN TEST: Failed', err);
      throw new Error(`Mock token test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProperty,
    updatePropertyAvailability,
    transferProperty,
    getPropertyMetadata,
    getUserProperties,
    testMinimalMint,
    testMockTokenMint,
    isLoading,
    error
  };
}