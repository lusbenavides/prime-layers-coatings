'use client';

import { useState } from 'react';
import { FAQ_ITEMS } from './data';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="faq" id="faq">
      <div className="faq-header reveal">
        <div className="eyebrow">Questions</div>
        <div className="sec-title">Frequently Asked</div>
        <p className="sec-sub">Quick answers — or chat with Ava anytime for instant help.</p>
      </div>
      <div className="faq-list reveal">
        {FAQ_ITEMS.map((item, i) => (
          <div key={item.q} className={`faq-item${openIndex === i ? ' open' : ''}`}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              {item.q}
            </button>
            <div className="faq-a"><p>{item.a}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
