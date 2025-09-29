import { useState } from 'react';
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/BecomeHost.module.css";
import dynamic from 'next/dynamic';
import { useNFT } from '@/hooks/useNFT';
import useHashConnect from '@/hooks/useHashConnect';

const HashConnectButton = dynamic(
  () => import('@/components/HashConnectButton'),
  { ssr: false }
);

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

export default function BecomeHost() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<any>(null);
  const { createProperty, testMinimalMint, testMockTokenMint, isLoading, error } = useNFT();
  const { isConnected } = useHashConnect();

  const [formData, setFormData] = useState<PropertyData>({
    name: '',
    description: '',
    location: '',
    propertyType: '',
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43'],
    pricePerNight: 100,
    availableDates: [
      Date.now() + 86400000, // Tomorrow
      Date.now() + 86400000 * 2, // Day after tomorrow
      Date.now() + 86400000 * 3, // Three days from now
    ]
  });

  const handleInputChange = (field: keyof PropertyData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.propertyType && formData.location &&
                 formData.description && formData.maxGuests > 0 &&
                 formData.bedrooms > 0 && formData.bathrooms > 0);
      case 2:
        return formData.amenities.length > 0;
      case 3:
        return formData.pricePerNight > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateStep(3)) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating property with data:', formData);

      const result = await createProperty(formData);

      console.log('Property created successfully:', result);
      setCreatedProperty(result);

      alert(`Property NFT created successfully! Token: ${result.tokenAddress}, Serial: ${result.serialNumber}`);
    } catch (err: any) {
      console.error('Error creating property:', err);
      alert(`Failed to create property: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const amenitiesList = [
    'WiFi', 'Kitchen', 'Parking', 'Pool', 'Gym', 'Air Conditioning',
    'Heating', 'TV', 'Washing Machine', 'Balcony', 'Garden', 'Hot Tub'
  ];

  if (createdProperty) {
    return (
      <>
        <Head>
          <title>Property Created - HederaStay</title>
        </Head>
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            <h2>🎉 Property NFT Created Successfully!</h2>
            <div className={styles.nftDetails}>
              <p><strong>Token Address:</strong> {createdProperty.tokenAddress}</p>
              <p><strong>Serial Number:</strong> {createdProperty.serialNumber}</p>
              <p><strong>Property Name:</strong> {formData.name}</p>
            </div>
            <div className={styles.successActions}>
              <Link href="/dashboard" className={styles.primaryButton}>
                View in Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className={styles.outlineButton}
              >
                Create Another Property
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Become a Host - HederaStay</title>
        <meta name="description" content="Share your space and earn crypto on HederaStay" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoText}>HederaStay</div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Explore</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/about">About</Link>
          <HashConnectButton />
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.steps}>
          <h2>Create Your Property NFT</h2>
          <div className={styles.stepsProgress}>
            <div className={`${styles.stepNumber} ${currentStep >= 1 ? styles.active : ''}`}>1</div>
            <div className={`${styles.stepLine} ${currentStep >= 2 ? styles.active : ''}`}></div>
            <div className={`${styles.stepNumber} ${currentStep >= 2 ? styles.active : ''}`}>2</div>
            <div className={`${styles.stepLine} ${currentStep >= 3 ? styles.active : ''}`}></div>
            <div className={`${styles.stepNumber} ${currentStep >= 3 ? styles.active : ''}`}>3</div>
          </div>
          <div className={styles.stepLabels}>
            <span>Property Details</span>
            <span>Photos & Amenities</span>
            <span>Pricing & Availability</span>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.formCard}>

              {/* Step 1: Property Details */}
              {currentStep === 1 && (
                <>
                  <h3>Property Details</h3>

                  <div className={styles.formGroup}>
                    <label>Property Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Give your property a catchy name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Property Type *</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    >
                      <option value="">Select property type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="cottage">Cottage</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Max Guests *</label>
                      <input
                        type="number"
                        value={formData.maxGuests}
                        onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Bedrooms *</label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Bathrooms *</label>
                      <input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value))}
                        min="1"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your property and what makes it special..."
                      rows={6}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Photos & Amenities */}
              {currentStep === 2 && (
                <>
                  <h3>Photos & Amenities</h3>

                  <div className={styles.formGroup}>
                    <label>Property Photo</label>
                    <div className={styles.imagePreview}>
                      <Image
                        src={formData.images[0]}
                        alt="Property preview"
                        width={400}
                        height={300}
                        style={{ borderRadius: '8px' }}
                      />
                      <p>Using default image for demo</p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Amenities *</label>
                    <div className={styles.amenitiesGrid}>
                      {amenitiesList.map((amenity) => (
                        <div
                          key={amenity}
                          className={`${styles.amenityCard} ${formData.amenities.includes(amenity) ? styles.selected : ''}`}
                          onClick={() => handleAmenityToggle(amenity)}
                        >
                          {amenity}
                        </div>
                      ))}
                    </div>
                    <p>Selected: {formData.amenities.join(', ') || 'None'}</p>
                  </div>
                </>
              )}

              {/* Step 3: Pricing & Availability */}
              {currentStep === 3 && (
                <>
                  <h3>Pricing & Availability</h3>

                  <div className={styles.formGroup}>
                    <label>Price per Night (HBAR) *</label>
                    <input
                      type="number"
                      value={formData.pricePerNight}
                      onChange={(e) => handleInputChange('pricePerNight', parseFloat(e.target.value))}
                      min="1"
                      step="0.01"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Available Dates</label>
                    <p>Demo: Next 3 days will be set as available</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Property Summary</label>
                    <div className={styles.summary}>
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Type:</strong> {formData.propertyType}</p>
                      <p><strong>Location:</strong> {formData.location}</p>
                      <p><strong>Capacity:</strong> {formData.maxGuests} guests, {formData.bedrooms} bed, {formData.bathrooms} bath</p>
                      <p><strong>Amenities:</strong> {formData.amenities.join(', ')}</p>
                      <p><strong>Price:</strong> {formData.pricePerNight} HBAR/night</p>
                    </div>
                  </div>

                  {!isConnected && (
                    <div className={styles.connectWallet}>
                      <p>⚠️ Please connect your wallet to create the property NFT</p>
                    </div>
                  )}

                  {isConnected && (
                    <div className={styles.formGroup}>
                      <label>🔧 Diagnostic Tests (for debugging)</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <button
                          onClick={async () => {
                            try {
                              setIsCreating(true);
                              await testMinimalMint();
                            } catch (err: any) {
                              alert(`Minimal test failed: ${err.message}`);
                            } finally {
                              setIsCreating(false);
                            }
                          }}
                          disabled={isLoading || isCreating}
                          className={styles.outlineButton}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          🧪 Test Minimal Mint
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setIsCreating(true);
                              await testMockTokenMint();
                            } catch (err: any) {
                              alert(`Mock token test failed: ${err.message}`);
                            } finally {
                              setIsCreating(false);
                            }
                          }}
                          disabled={isLoading || isCreating}
                          className={styles.outlineButton}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          🎭 Test Mock Token Mint
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                        These tests help isolate the protobuf error by testing different transaction approaches.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className={styles.formActions}>
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className={styles.outlineButton}
                  >
                    Back
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                    className={styles.primaryButton}
                  >
                    Next: {currentStep === 1 ? 'Photos & Amenities' : 'Pricing & Availability'}
                    <Image src="/icons/arrow-right.svg" alt="Arrow right" width={16} height={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isConnected || !validateStep(3) || isCreating || isLoading}
                    className={styles.primaryButton}
                  >
                    {isCreating || isLoading ? 'Creating NFT...' : 'Create Property NFT'}
                  </button>
                )}
              </div>

              {error && (
                <div className={styles.error}>
                  Error: {error}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}