'use client';

import { HeroVisual } from './HeroVisual';
import { FAQ } from './FAQ';
import { QuoteForm } from './QuoteForm';
import { ChatWidget } from './ChatWidget';
import { ScrollReveal } from './ScrollReveal';
import {
  TICKER_ITEMS, SERVICES, PROCESS_STEPS, GALLERY_ITEMS,
  REVIEWS, AREAS, GOOGLE_MAPS_URL,
} from './data';

function GalleryImage({ webp, jpeg, alt, priority }: { webp: string; jpeg: string; alt: string; priority?: boolean }) {
  return (
    <picture>
      <source srcSet={`/fotos/${webp}`} type="image/webp" />
      <img
        src={`/fotos/${jpeg}`}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
      />
    </picture>
  );
}

export default function MarketingPage() {
  const openAva = () => (window as Window & { openAvaChat?: () => void }).openAvaChat?.();

  return (
    <>
      <ScrollReveal />

      <header>
        <div className="logo">
          <div className="logo-main">PRIME LAYER <em>COATINGS</em></div>
          <div className="logo-sub">LLC — Professional Painting Services</div>
        </div>
        <nav>
          <a href="#services">Services</a>
          <a href="#gallery">Gallery</a>
          <a href="#reviews">Reviews</a>
          <a href="#areas">Areas</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href="tel:7253181411" className="header-cta">📞 725-318-1411</a>
      </header>

      <section className="hero">
        <div className="hero-left">
          <div className="hero-pill"><div className="pulse-dot" />Licensed &amp; Insured · All Las Vegas</div>
          <h1>Professional <span className="accent">Painting</span> Services</h1>
          <div className="hero-rule" />
          <p>We bring color, quality, and lasting protection to every space — residential and commercial. Mobile service across the entire Las Vegas valley. Craftsmanship you can see, results that endure.</p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">📤 Free Quote</a>
            <a href="tel:7253181411" className="btn-ghost">📞 Call Us</a>
          </div>
          <div className="hero-badges">
            <div className="hbadge"><div className="hbadge-dot" />Licensed &amp; Insured</div>
            <div className="hbadge"><div className="hbadge-dot" />Hablamos Español</div>
            <div className="hbadge"><div className="hbadge-dot" />Free Estimates</div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-visual"><HeroVisual /></div>
          <div className="stat-card-2"><div className="stat-num-2">500+</div><div className="stat-lbl-2">Projects Done</div></div>
          <div className="stat-card"><div className="stat-num">100%</div><div className="stat-lbl">Quality Guaranteed</div></div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].flatMap((item, i) => [
            <span key={`t-${i}`} className="ticker-item">{item}</span>,
            <span key={`s-${i}`} className="ticker-item ticker-sep">✦</span>,
          ])}
        </div>
      </div>

      <section className="services" id="services">
        <div className="services-header reveal">
          <div><div className="eyebrow">What We Do</div><div className="sec-title">Our Services</div></div>
          <div className="sec-sub">High-quality workmanship for residential and commercial properties — we come to you anywhere in the Las Vegas valley.</div>
        </div>
        <div className="services-grid services-grid-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="svc-card reveal">
              <div className="svc-ghost">{s.ghost}</div>
              <div className="svc-icon-wrap">{s.icon}</div>
              <div className="svc-title">{s.title}</div>
              <p className="svc-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="process" id="process">
        <div className="process-header reveal">
          <div className="eyebrow">How It Works</div>
          <div className="sec-title">Our Process</div>
          <div className="sec-sub" style={{ maxWidth: 480, margin: '0 auto' }}>Simple, transparent, and stress-free from first call to final coat.</div>
        </div>
        <div className="process-steps">
          {PROCESS_STEPS.map((s) => (
            <div key={s.num} className="step reveal">
              <div className="step-num">{s.num}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery" id="gallery">
        <div className="gallery-header reveal">
          <div className="eyebrow">Our Work</div>
          <div className="sec-title">Project Gallery</div>
        </div>
        <div className="gallery-grid reveal">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.tag + item.label} className="gal-item">
              {item.type === 'image' ? (
                <GalleryImage webp={item.webp} jpeg={item.jpeg} alt={item.alt} priority={item.priority} />
              ) : (
                <>
                  <video src={`/fotos/${item.src}`} autoPlay loop muted playsInline preload="metadata" />
                  <div className="gal-play">▶</div>
                </>
              )}
              <div className="gal-overlay">
                <div className="gal-tag">{item.tag}</div>
                <div className="gal-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="reviews" id="reviews">
        <div className="reviews-header reveal">
          <div className="eyebrow">Client Love</div>
          <div className="sec-title">Google Reviews</div>
          <p className="sec-sub">We&apos;re building our reputation one project at a time. Here&apos;s what Las Vegas homeowners are saying.</p>
        </div>
        <div className="reviews-grid reveal">
          {REVIEWS.map((r) => (
            <article key={r.author} className="review-card">
              <div className="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p className="review-text">&ldquo;{r.text}&rdquo;</p>
              <div className="review-author">{r.author}</div>
              <div className="review-via">via Google</div>
            </article>
          ))}
        </div>
        <div className="reviews-cta reveal">
          <a href={GOOGLE_MAPS_URL} className="btn-ghost reviews-link" target="_blank" rel="noopener noreferrer">⭐ See our reviews on Google</a>
        </div>
      </section>

      <section className="areas" id="areas">
        <div className="areas-inner reveal">
          <div className="areas-copy">
            <div className="eyebrow">Where We Work</div>
            <div className="sec-title">All Las Vegas Valley</div>
            <p className="sec-sub">We&apos;re a mobile painting company — no storefront needed. We travel to your home or business anywhere in the greater Las Vegas area.</p>
            <ul className="areas-list">{AREAS.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div className="areas-map-wrap">
            <iframe
              title="Prime Layer Coatings service area — Las Vegas Nevada"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d64389.84702882352!2d-115.242!3d36.169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80beb782a4f57dd1%3A0x3accd9122f8c4e258!2sLas%20Vegas%2C%20NV!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="areas-map-badge">
              📍 Mobile service — we come to you ·{' '}
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="why">
        <div className="why-img-wrap reveal">
          <picture>
            <source srcSet="/fotos/7740.webp" type="image/webp" />
            <img src="/fotos/7740.jpeg" alt="Prime Layer Coatings project detail" loading="lazy" decoding="async" />
          </picture>
          <div className="why-badge-circle"><div className="wbc-num">★</div><div className="wbc-lbl">Top<br />Rated</div></div>
        </div>
        <div className="reveal">
          <div className="eyebrow">Why Choose Us</div>
          <div className="sec-title">Built on Trust &amp; Craft</div>
          <div className="why-points">
            {[
              { icon: '🛡️', title: 'Licensed & Insured', desc: 'Full liability coverage so your home and investment are protected from start to finish — no surprises.' },
              { icon: '🎨', title: 'Premium Materials Only', desc: 'We use only top-grade paints and coatings that last, ensuring a beautiful result that holds up for years.' },
              { icon: '🗣️', title: 'English & Spanish', desc: 'We proudly serve our bilingual community — fluent in English and Spanish for your convenience.' },
              { icon: '🤖', title: 'Ava — AI Assistant 24/7', desc: 'Questions at midnight? Ava answers FAQs instantly and can even help fill out your quote form so you never miss a lead.' },
            ].map((p) => (
              <div key={p.title} className="why-pt">
                <div className="why-pt-icon">{p.icon}</div>
                <div><div className="why-pt-title">{p.title}</div><div className="why-pt-desc">{p.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      <section className="contact" id="contact">
        <div className="contact-inner">
          <div className="contact-left reveal">
            <div className="eyebrow">Get In Touch</div>
            <div className="sec-title">Ready to <em>Transform</em><br />Your Space?</div>
            <div className="contact-rule"><div className="contact-rule-line" /><div className="contact-rule-dot" /><div className="contact-rule-line" /></div>
            <p>Reach out today and we&apos;ll get back to you fast. Mobile service anywhere in Las Vegas — one call away.</p>
            <div className="contact-cards">
              <a href="tel:7253181411" className="contact-card"><div className="cc-icon">📞</div><div><div className="cc-lbl">Phone</div><div className="cc-val">725-318-1411</div></div></a>
              <a href="mailto:primelayercoating@gmail.com" className="contact-card"><div className="cc-icon">✉</div><div><div className="cc-lbl">Email</div><div className="cc-val">primelayercoating@gmail.com</div></div></a>
              <div className="contact-card contact-card-static"><div className="cc-icon">🚐</div><div><div className="cc-lbl">Service Area</div><div className="cc-val">All Las Vegas Valley, NV</div></div></div>
              <a href="https://www.instagram.com/primelayercoating" className="contact-card" target="_blank" rel="noopener noreferrer"><div className="cc-icon">📷</div><div><div className="cc-lbl">Instagram</div><div className="cc-val">@primelayercoating</div></div></a>
              <a href="https://www.facebook.com/share/1GhCG1cqux/" className="contact-card" target="_blank" rel="noopener noreferrer"><div className="cc-icon">👍</div><div><div className="cc-lbl">Facebook</div><div className="cc-val">Prime Layer Coatings</div></div></a>
              <a href="https://www.linkedin.com/in/mirna-enamorado-0b5812421" className="contact-card" target="_blank" rel="noopener noreferrer"><div className="cc-icon">💼</div><div><div className="cc-lbl">LinkedIn</div><div className="cc-val">Mirna Enamorado</div></div></a>
            </div>
            <div className="bilingual">🗣️ <strong>Hablamos Español</strong> — We serve the bilingual community with pride.</div>
          </div>
          <div className="contact-cta-block reveal">
            <div className="ctab-eyebrow">No Commitment Required</div>
            <div className="ctab-title">Get Your Free Estimate Today</div>
            <div className="ctab-desc">Fill out the form — or let <strong>Ava</strong> help you 24/7. Our smart system processes requests within 24 hours. No pressure, no obligation.</div>
            <QuoteForm onAskAva={openAva} />
          </div>
        </div>
        <section className="horarios-section">
          <div className="horarios-card">
            <h2>Business Hours</h2>
            {[
              ['Monday', '8:00 AM – 5:00 PM'], ['Tuesday', '8:00 AM – 5:00 PM'], ['Wednesday', '8:00 AM – 5:00 PM'],
              ['Thursday', '8:00 AM – 5:00 PM'], ['Friday', '8:00 AM – 5:00 PM'], ['Saturday', '9:00 AM – 3:00 PM'],
            ].map(([day, hours]) => (
              <div key={day} className="horario-row"><span>{day}</span><span>{hours}</span></div>
            ))}
            <div className="horario-row closed"><span>Sunday</span><span>Closed</span></div>
          </div>
        </section>
      </section>

      <footer>
        <div className="footer-logo">PRIME LAYER <em>COATINGS</em> LLC</div>
        <div className="footer-social">
          <a href="https://www.instagram.com/primelayercoating" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/share/1GhCG1cqux/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.linkedin.com/in/mirna-enamorado-0b5812421" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
        <div className="footer-copy">&copy; 2026 Prime Layer Coatings LLC. All rights reserved.</div>
        <div className="footer-lang">🗣️ English &amp; Español · Serving all Las Vegas, NV</div>
      </footer>

      <ChatWidget />
    </>
  );
}
