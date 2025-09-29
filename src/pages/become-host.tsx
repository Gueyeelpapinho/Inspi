import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/BecomeHost.module.css";
import dynamic from 'next/dynamic';

const HashConnectButton = dynamic(
  () => import('@/components/HashConnectButton'),
  { ssr: false }
);

export default function BecomeHost() {
  return (
    <>
      <Head>
        <title>Become a Host - HeberaStays</title>
        <meta name="description" content="Share your space and earn crypto on HeberaStays" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoText}>HederaStay</div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Explore</Link>
          <Link href="/about">About</Link>
          <Link href="/help">Help</Link>
          <HashConnectButton />
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Share your space, earn crypto</h1>
            <p>Join thousands of hosts earning HBAR by sharing their homes on the first decentralized accommodation marketplace</p>
            <button className={styles.primaryButton}>
              Get Started
              <Image src="/icons/arrow-right.svg" alt="Arrow right" width={18} height={18} />
            </button>
          </div>
          <div className={styles.heroImage}>
            <Image src="/images/placeholder.jpg" alt="Luxury home" width={688} height={516} />
          </div>
        </section>

        <section className={styles.steps}>
          <h2>Become a Host in 3 Easy Steps</h2>
          <div className={styles.stepsProgress}>
            <div className={styles.stepNumber + " " + styles.active}>1</div>
            <div className={styles.stepLine + " " + styles.active}></div>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLine}></div>
            <div className={styles.stepNumber}>3</div>
          </div>
          <div className={styles.stepLabels}>
            <span>Property Details</span>
            <span>Photos & Amenities</span>
            <span>Pricing & Availability</span>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.formCard}>
              <h3>Property Details</h3>
              
              <div className={styles.formGroup}>
                <label>Property Name</label>
                <input type="text" placeholder="Give your property a catchy name" />
              </div>

              <div className={styles.formGroup}>
                <label>Property Type</label>
                <select>
                  <option value="">Select property type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="cottage">Cottage</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Location</label>
                <div className={styles.locationInput}>
                  <input type="text" placeholder="Enter your address" />
                  <button className={styles.mapButton}>
                    <Image src="/icons/map.svg" alt="Map" width={16} height={16} />
                    Map
                  </button>
                </div>
                <div className={styles.mapPreview}>
                  Map preview will appear here
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Max Guests</label>
                  <input type="number" placeholder="4" min="1" />
                </div>
                <div className={styles.formGroup}>
                  <label>Bedrooms</label>
                  <input type="number" placeholder="2" min="1" />
                </div>
                <div className={styles.formGroup}>
                  <label>Bathrooms</label>
                  <input type="number" placeholder="1.5" min="1" step="0.5" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea placeholder="Describe your property and what makes it special..." rows={6}></textarea>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primaryButton}>
                  Next: Photos & Amenities
                  <Image src="/icons/arrow-right.svg" alt="Arrow right" width={16} height={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.benefits}>
          <h2>Why Host on HederaStay?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <Image src="/icons/secure.svg" alt="Secure payments" width={24} height={24} />
              </div>
              <h3>Secure Payments</h3>
              <p>Receive payments directly in HBAR cryptocurrency through secure blockchain transactions with no intermediaries.</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <Image src="/icons/fees.svg" alt="Lower fees" width={24} height={24} />
              </div>
              <h3>Lower Fees</h3>
              <p>Enjoy significantly lower commission rates compared to traditional accommodation platforms.</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <Image src="/icons/middlemen.svg" alt="Full control" width={24} height={24} />
              </div>
              <h3>Full Control</h3>
              <p>Maintain complete ownership of your listing data and guest relationships through decentralized technology.</p>
            </div>
          </div>
        </section>

        <section className={styles.faq}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3>How do I receive payments in HBAR?</h3>
              <p>You'll need to set up a Hedera wallet to receive HBAR payments. We'll guide you through the process during onboarding and provide resources to help you manage your cryptocurrency.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>What fees does HederaStay charge?</h3>
              <p>HederaStay charges a 3% service fee on bookings, significantly lower than the 15-20% charged by traditional platforms. This is possible thanks to our efficient blockchain infrastructure.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>How are guests verified?</h3>
              <p>Guests go through a decentralized identity verification process that respects privacy while ensuring security. Our smart contracts also handle security deposits automatically.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>What happens if there's a dispute with a guest?</h3>
              <p>Our platform includes a decentralized dispute resolution system where community mediators help resolve issues fairly and transparently.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Ready to experience the future of property rentals?</h2>
          <p>Join thousands of users already booking and hosting with cryptocurrency</p>
          <div className={styles.ctaButtons}>
            <Link href="/explore" className={styles.primaryButton}>Start Booking</Link>
            <Link href="/become-host" className={styles.outlineButton}>List Your Property</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h3>HeberaStays</h3>
              <Link href="/about">About Us</Link>
              <Link href="/how-it-works">How it Works</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/press">Press</Link>
              <Link href="/blog">Blog</Link>
            </div>
            <div className={styles.footerColumn}>
              <h3>Community</h3>
              <Link href="/diversity">Diversity & Inclusion</Link>
              <Link href="/accessibility">Accessibility</Link>
              <Link href="/associates">Associates</Link>
              <Link href="/referrals">Referrals</Link>
              <Link href="/forum">Forum</Link>
            </div>
            <div className={styles.footerColumn}>
              <h3>Host</h3>
              <Link href="/host-home">Host your home</Link>
              <Link href="/host-experience">Host an experience</Link>
              <Link href="/responsible-hosting">Responsible hosting</Link>
              <Link href="/resource-center">Resource center</Link>
              <Link href="/community-center">Community center</Link>
            </div>
            <div className={styles.footerColumn}>
              <h3>Support</h3>
              <Link href="/help">Help Center</Link>
              <Link href="/cancellation">Cancellation options</Link>
              <Link href="/neighborhood">Neighborhood Support</Link>
              <Link href="/trust-safety">Trust & Safety</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerCopyright}>
              <span>© 2023 HeberaStays, Inc.</span>
              <div className={styles.footerDivider}></div>
              <Link href="/privacy">Privacy</Link>
              <div className={styles.footerDivider}></div>
              <Link href="/terms">Terms</Link>
              <div className={styles.footerDivider}></div>
              <Link href="/sitemap">Sitemap</Link>
            </div>
            <div className={styles.footerSocial}>
              <Link href="#"><Image src="/facebook.svg" alt="Facebook" width={20} height={20} /></Link>
              <Link href="#"><Image src="/twitter.svg" alt="Twitter" width={20} height={20} /></Link>
              <Link href="#"><Image src="/instagram.svg" alt="Instagram" width={20} height={20} /></Link>
              <Link href="#"><Image src="/youtube.svg" alt="YouTube" width={20} height={20} /></Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
} 