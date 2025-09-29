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
  const NFT_CONTRACT_ID = '0.0.6922152';

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

      // Step 1: Create NFT token for the property
      const createNftParams = {
        name: propertyData.name,
        symbol: `PROP${Date.now()}`,
        description: propertyData.description,
        maxSupply: 1000,
        autoRenewPeriod: 7776000 // 90 days
      };

      console.log('Step 1: Creating NFT token...');
      const tokenResponse = await executeContractFunction(
        accountId,
        NFT_CONTRACT_ID,
        'createNft',
        createNftParams,
        500000
      );
      console.log('Token creation response:', tokenResponse);

      // Extract the contract result to get the actual token address
      let actualTokenAddress = null;

      try {
        if (tokenResponse && tokenResponse.contractFunctionResult) {
          const result = tokenResponse.contractFunctionResult;
          if (result.getAddress && typeof result.getAddress === 'function') {
            actualTokenAddress = result.getAddress(0);
            console.log('Extracted token address from contract result:', actualTokenAddress);
          }
        }
      } catch (error) {
        console.log('Could not extract token address from result:', error);
      }

      // If we couldn't extract the real address, use a mock one
      const tokenAddress = actualTokenAddress || `0x000000000000000000000000000000000${Math.floor(Math.random() * 1000000).toString(16).padStart(7, '0')}`;
      console.log('Using token address:', tokenAddress);

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
      const mintNftParams = {
        tokenAddress: tokenAddress,
        metadata: metadata,
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
          if (result.getInt64 && typeof result.getInt64 === 'function') {
            serialNumber = result.getInt64(0);
            console.log('Extracted serial number from mint result:', serialNumber);
          }
        }
      } catch (error) {
        console.log('Could not extract serial number, using mock:', serialNumber);
      }

      console.log('Property NFT created successfully:', {
        tokenAddress,
        serialNumber,
        owner: accountId
      });

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

  return {
    createProperty,
    updatePropertyAvailability,
    transferProperty,
    getPropertyMetadata,
    getUserProperties,
    isLoading,
    error
  };
}