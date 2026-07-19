import type { Metadata } from 'next';
import ClientTrackPage from './ClientTrackPage';

export const metadata: Metadata = {
  title: 'Track Your Project | Prime Layer Coatings',
  robots: { index: false, follow: false },
};

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  return <ClientTrackPage params={params} />;
}
