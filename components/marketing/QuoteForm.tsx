'use client';

import { useState, FormEvent } from 'react';

export function QuoteForm({ onAskAva }: { onAskAva?: () => void }) {
  const [response, setResponse] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch('/api/submit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          projectType: fd.get('project-type'),
          description: fd.get('description'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      setResponse({ type: 'success', text: '¡Cotización recibida con éxito! Nuestro equipo la procesará pronto.' });
      form.reset();
    } catch (err) {
      setResponse({ type: 'error', text: `Hubo un inconveniente: ${(err as Error).message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form id="quote-form" className="quote-form" onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email Address" />
        <input type="tel" name="phone" placeholder="Phone Number" required />
        <select name="project-type" required defaultValue="">
          <option value="" disabled>Project Type</option>
          <option value="interior">Interior Painting</option>
          <option value="exterior">Exterior Painting</option>
          <option value="cabinets">Cabinet Refinishing</option>
          <option value="epoxy">Epoxy Floor Coatings</option>
          <option value="commercial">Commercial</option>
          <option value="other">Other</option>
        </select>
        <textarea name="description" placeholder="Tell us about your project..." rows={3} />
        <button type="submit" className="ctab-btn quote-submit-btn" disabled={loading}>
          {loading ? 'Sending…' : '📤 Send Quote Request'}
        </button>
        {response && (
          <div className={`response-message ${response.type}`}>{response.text}</div>
        )}
      </form>
      <div className="ctab-note">
        Or call us at 725-318-1411 ·{' '}
        <button type="button" className="ctab-ava-link" onClick={onAskAva}>Ask Ava to help →</button>
      </div>
    </>
  );
}
