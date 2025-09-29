import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/Home.module.css";
import dynamic from 'next/dynamic';

const HashConnectButton = dynamic(
  () => import('@/components/HashConnectButton'),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>HeberaStays - Book and Host Properties with Crypto</title>
        <meta name="description" content="HeberaStays - Book and host properties with cryptocurrency on the Hedera blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>H</div>
          <div className={styles.logoText}>HeberaStays</div>
        </div>

        <div className={styles.searchBar}>
          <div>Anywhere</div>
          <div className={styles.searchDivider}></div>
          <div>Any week</div>
          <div className={styles.searchDivider}></div>
          <div>Add guests</div>
          <div className={styles.searchButton}>
            <Image src="/search.svg" alt="Search" width={16} height={16} />
          </div>
        </div>

        <div className={styles.nav}>
          <Link href="/become-host" className={styles.navLink}>Become a Host</Link>
          <Image src="/globe.svg" alt="Language" width={16} height={16} />
          <HashConnectButton />
          <div className={styles.userMenu}>
            <Image src="/menu.svg" alt="Menu" width={16} height={16} />
            <Image src="/user.svg" alt="User" width={24} height={24} />
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} style={{backgroundImage: 'url(https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80)'}}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Book and Host Properties with Crypto</h1>
            <p className={styles.heroSubtitle}>Secure, transparent, and decentralized on Hedera blockchain</p>
            <button className="btn btn-primary">Explore Properties</button>
          </div>
        </section>

        <div className="container">
          <div className={styles.searchBox}>
            <div className={styles.searchGrid}>
              <div className={styles.searchField}>
                <label>Location</label>
                <div className={styles.searchInput}>
                  <Image src="/location.svg" alt="Location" width={14} height={14} />
                  <span>Where are you going?</span>
                </div>
              </div>
              <div className={styles.searchField}>
                <label>Check in</label>
                <div className={styles.searchInput}>
                  <Image src="/calendar.svg" alt="Calendar" width={14} height={14} />
                  <span>Add dates</span>
                </div>
              </div>
              <div className={styles.searchField}>
                <label>Check out</label>
                <div className={styles.searchInput}>
                  <Image src="/calendar.svg" alt="Calendar" width={14} height={14} />
                  <span>Add dates</span>
                </div>
              </div>
              <div className={styles.searchField}>
                <label>Guests</label>
                <div className={styles.searchInput}>
                  <Image src="/users.svg" alt="Users" width={14} height={14} />
                  <span>Add guests</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{margin: '16px auto 0', display: 'block'}}>
              <Image src="/search.svg" alt="Search" width={16} height={16} />
              Search
            </button>
          </div>
        </div>

        <section className={styles.categories}>
          <h2 className={styles.sectionTitle}>Explore by category</h2>
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <div key={index} className={styles.categoryItem}>
                <div className={styles.categoryImage}>
                  <Image src={category.image} alt={category.name} width={64} height={64} />
                </div>
                <span className={styles.categoryName}>{category.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.properties}>
          <h2 className={styles.sectionTitle}>Featured Properties</h2>
          <div className={styles.propertyGrid}>
            {properties.map((property, index) => (
              <div key={index} className="property-card">
                <div style={{position: 'relative'}}>
                  <Image src={property.image} alt={property.title} width={326} height={192} />
                  <div className="verified-badge" style={{position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 4px', borderRadius: '3px', fontSize: '10px', lineHeight: '1'}}>
                    ✓
                  </div>
                </div>
                <div className="content">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                    <div className="text-tertiary text-sm">{property.location}</div>
                    <div className="rating">
                      <Image src="/star.svg" alt="Rating" width={16} height={16} />
                      <span className="score">{property.rating}</span>
                      <span>({property.reviews})</span>
                    </div>
                  </div>
                  <h3 style={{fontWeight: 500, marginBottom: 16}}>{property.title}</h3>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                    <div className="price">
                      <span className="hbar">{property.price} HBAR</span>
                      <span className="usd">${property.usd} USD / night</span>
                    </div>
                    <button className="btn btn-primary" style={{padding: '4px 12px', fontSize: '14px'}}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.advantages}>
          <h2 className={styles.sectionTitle}>The Web3 Advantage</h2>
          <div className={styles.advantageGrid}>
            {advantages.map((advantage, index) => (
              <div key={index} className={styles.advantageItem}>
                <div className={styles.advantageIcon}>
                  <Image src={advantage.icon} alt={advantage.title} width={24} height={24} />
                </div>
                <h3 className={styles.advantageTitle}>{advantage.title}</h3>
                <p className={styles.advantageText}>{advantage.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to experience the future of property rentals?</h2>
          <p className={styles.ctaText}>Join thousands of users already booking and hosting with cryptocurrency</p>
          <div className={styles.ctaButtons}>
            <Link href="/explore" className="btn btn-primary">Start Booking</Link>
            <Link href="/become-host" className="btn btn-outline">List Your Property</Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h3>HeberaStays</h3>
              <div className={styles.footerLinks}>
                <a href="#">About Us</a>
                <a href="#">How it Works</a>
                <a href="#">Careers</a>
                <a href="#">Press</a>
                <a href="#">Blog</a>
              </div>
            </div>
            <div className={styles.footerColumn}>
              <h3>Community</h3>
              <div className={styles.footerLinks}>
                <a href="#">Diversity & Inclusion</a>
                <a href="#">Accessibility</a>
                <a href="#">Associates</a>
                <a href="#">Referrals</a>
                <a href="#">Forum</a>
              </div>
            </div>
            <div className={styles.footerColumn}>
              <h3>Host</h3>
              <div className={styles.footerLinks}>
                <Link href="/become-host">Host your home</Link>
                <Link href="/become-host">Host an experience</Link>
                <Link href="/responsible-hosting">Responsible hosting</Link>
                <a href="#">Resource center</a>
                <a href="#">Community center</a>
              </div>
            </div>
            <div className={styles.footerColumn}>
              <h3>Support</h3>
              <div className={styles.footerLinks}>
                <a href="#">Help Center</a>
                <a href="#">Cancellation options</a>
                <a href="#">Neighborhood Support</a>
                <a href="#">Trust & Safety</a>
                <a href="#">Contact Us</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerCopyright}>
              <span>© 2023 HeberaStays, Inc.</span>
              <div className={styles.footerDivider}></div>
              <a href="#">Privacy</a>
              <div className={styles.footerDivider}></div>
              <a href="#">Terms</a>
              <div className={styles.footerDivider}></div>
              <a href="#">Sitemap</a>
            </div>
            <div className={styles.footerSocial}>
              <a href="#"><Image src="/facebook.svg" alt="Facebook" width={20} height={20} /></a>
              <a href="#"><Image src="/twitter.svg" alt="Twitter" width={20} height={20} /></a>
              <a href="#"><Image src="/instagram.svg" alt="Instagram" width={20} height={20} /></a>
              <a href="#"><Image src="/youtube.svg" alt="YouTube" width={20} height={20} /></a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

const categories = [
  { name: 'Beach', image: '/images/category-beach.svg' },
  { name: 'Mountain', image: '/images/category-mountain.svg' },
  { name: 'City', image: '/images/category-city.svg' },
  { name: 'Countryside', image: '/images/category-mountain.svg' },
  { name: 'Luxury', image: '/images/category-luxury.svg' },
  { name: 'Unique', image: '/images/category-luxury.svg' },
  { name: 'Pool', image: '/images/category-beach.svg' },
  { name: 'Lake', image: '/images/category-mountain.svg' },
];

const properties = [
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=500&q=80',
    location: 'Villa in Malibu, California',
    rating: '4.97',
    reviews: 128,
    title: 'Luxury Villa with Ocean View',
    price: '1250',
    usd: '250'
  },
  {
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500&q=80',
    location: 'Apartment in New York, NY',
    rating: '4.85',
    reviews: 96,
    title: 'Modern Downtown Apartment',
    price: '900',
    usd: '180'
  },
  {
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=500&q=80',
    location: 'Cabin in Aspen, Colorado',
    rating: '4.92',
    reviews: 74,
    title: 'Cozy Mountain Cabin',
    price: '1050',
    usd: '210'
  },
  {
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=500&q=80',
    location: 'Bungalow in Miami, Florida',
    rating: '4.89',
    reviews: 112,
    title: 'Beachfront Bungalow',
    price: '975',
    usd: '195'
  },
  {
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80',
    location: 'Loft in Barcelona, Spain',
    rating: '4.78',
    reviews: 86,
    title: 'Historic City Center Loft',
    price: '825',
    usd: '165'
  },
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
    location: 'Farmhouse in Tuscany, Italy',
    rating: '4.95',
    reviews: 104,
    title: 'Countryside Farmhouse',
    price: '1150',
    usd: '230'
  },
  {
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&q=80',
    location: 'Cottage in Lake Tahoe, Nevada',
    rating: '4.82',
    reviews: 68,
    title: 'Lakeside Cottage',
    price: '875',
    usd: '175'
  },
  {
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80',
    location: 'Penthouse in Los Angeles, California',
    rating: '4.99',
    reviews: 142,
    title: 'Luxury Penthouse',
    price: '1600',
    usd: '320'
  }
];

const advantages = [
  {
    icon: '/icons/secure.svg',
    title: 'Secure Payments',
    text: "All transactions are secured by Hedera's distributed ledger technology"
  },
  {
    icon: '/icons/middlemen.svg',
    title: 'No Middlemen',
    text: 'Connect directly with property owners through smart contracts'
  },
  {
    icon: '/icons/fees.svg',
    title: 'Lower Fees',
    text: 'Save up to 15% compared to traditional booking platforms'
  },
  {
    icon: '/icons/reviews.svg',
    title: 'Transparent Reviews',
    text: 'Verified reviews stored immutably on the blockchain'
  }
];
