import { useState, useEffect } from 'react';
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/Dashboard.module.css";
import dynamic from 'next/dynamic';
import { useNFT } from '@/hooks/useNFT';
import useHashConnect from '@/hooks/useHashConnect';

const HashConnectButton = dynamic(
  () => import('@/components/HashConnectButton'),
  { ssr: false }
);

interface PropertyNFT {
  tokenAddress: string;
  serialNumber: number;
  transactionId?: string;
  metadata: {
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
    owner: string;
    createdAt: number;
  };
}

export default function Dashboard() {
  const [properties, setProperties] = useState<PropertyNFT[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { getUserProperties, isLoading, error } = useNFT();
  const { isConnected, accountId } = useHashConnect();

  const loadProperties = async () => {
    if (!isConnected) return;

    setIsRefreshing(true);
    try {
      console.log('🏠 DASHBOARD: Loading user properties...');
      const userProperties = await getUserProperties();
      console.log('🏠 DASHBOARD: Loaded properties:', userProperties);
      setProperties(userProperties);
    } catch (err) {
      console.error('🏠 DASHBOARD: Error loading properties:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [isConnected, accountId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTokenAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 8)}...${address.slice(-8)}`;
    }
    return address;
  };

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Dashboard - HederaStay</title>
        </Head>

        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoText}>HederaStay</div>
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Explore</Link>
            <Link href="/become-host">Become a Host</Link>
            <Link href="/about">About</Link>
            <HashConnectButton />
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.connectPrompt}>
            <div className={styles.connectCard}>
              <h1>Connect Your Wallet</h1>
              <p>Please connect your wallet to view your property NFTs and manage your listings.</p>
              <HashConnectButton />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - HederaStay</title>
        <meta name="description" content="Manage your property NFTs on HederaStay" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoText}>HederaStay</div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Explore</Link>
          <Link href="/become-host">Become a Host</Link>
          <Link href="/about">About</Link>
          <HashConnectButton />
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.dashboardContainer}>
          <div className={styles.dashboardHeader}>
            <h1>My Property NFTs</h1>
            <div className={styles.accountInfo}>
              <p><strong>Connected Account:</strong> {accountId}</p>
              <button
                onClick={loadProperties}
                disabled={isRefreshing || isLoading}
                className={styles.refreshButton}
              >
                {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <p>Error loading properties: {error}</p>
            </div>
          )}

          {isLoading && !isRefreshing && (
            <div className={styles.loading}>
              <p>Loading your properties...</p>
            </div>
          )}

          {!isLoading && !error && properties.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateCard}>
                <h2>No Properties Yet</h2>
                <p>You haven't created any property NFTs yet. Start by creating your first property!</p>
                <Link href="/become-host" className={styles.createButton}>
                  Create Your First Property NFT
                </Link>
              </div>
            </div>
          )}

          {properties.length > 0 && (
            <div className={styles.propertiesGrid}>
              {properties.map((property, index) => (
                <div key={`${property.tokenAddress}-${property.serialNumber}`} className={styles.propertyCard}>
                  <div className={styles.propertyImage}>
                    <Image
                      src={property.metadata.images[0] || '/placeholder-property.jpg'}
                      alt={property.metadata.name}
                      width={300}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.propertyType}>
                      {property.metadata.propertyType}
                    </div>
                  </div>

                  <div className={styles.propertyContent}>
                    <h3>{property.metadata.name}</h3>
                    <p className={styles.location}>{property.metadata.location}</p>
                    <p className={styles.description}>{property.metadata.description}</p>

                    <div className={styles.propertyDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Guests:</span>
                        <span>{property.metadata.maxGuests}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Bedrooms:</span>
                        <span>{property.metadata.bedrooms}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Bathrooms:</span>
                        <span>{property.metadata.bathrooms}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Price:</span>
                        <span>{property.metadata.pricePerNight} HBAR/night</span>
                      </div>
                    </div>

                    <div className={styles.amenities}>
                      <span className={styles.amenitiesLabel}>Amenities:</span>
                      <div className={styles.amenitiesList}>
                        {property.metadata.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className={styles.amenityTag}>{amenity}</span>
                        ))}
                        {property.metadata.amenities.length > 3 && (
                          <span className={styles.amenityTag}>+{property.metadata.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.nftInfo}>
                      <div className={styles.nftDetail}>
                        <span className={styles.nftLabel}>Token:</span>
                        <span className={styles.nftValue}>{formatTokenAddress(property.tokenAddress)}</span>
                      </div>
                      <div className={styles.nftDetail}>
                        <span className={styles.nftLabel}>Serial:</span>
                        <span className={styles.nftValue}>#{property.serialNumber}</span>
                      </div>
                      <div className={styles.nftDetail}>
                        <span className={styles.nftLabel}>Created:</span>
                        <span className={styles.nftValue}>{formatDate(property.metadata.createdAt)}</span>
                      </div>
                    </div>

                    <div className={styles.propertyActions}>
                      <Link
                        href={`/property/${property.tokenAddress}/${property.serialNumber}`}
                        className={styles.viewButton}
                      >
                        View Details
                      </Link>
                      <button className={styles.manageButton}>
                        Manage Availability
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.dashboardActions}>
            <Link href="/become-host" className={styles.addPropertyButton}>
              + Add New Property
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}