import { useEffect, useMemo } from 'react';
import { useHashRoute, navigate } from '@/hooks/useHashRoute';
import FallFGame from '@/components/game/fall-f/FallFGame';
import CatalogPage from '@/components/game/CatalogPage';

function getSlugAndSeed(path: string): { slug: string | null; seed: number | null } {
  const queryIdx = path.indexOf('?');
  const bare = queryIdx === -1 ? path : path.slice(0, queryIdx);
  const query = queryIdx === -1 ? '' : path.slice(queryIdx + 1);
  const parts = bare.split('/').filter(Boolean);
  const slug = parts[0] === 'game' ? (parts[1] ?? null) : null;
  const params = new URLSearchParams(query);
  const seedRaw = params.get('seed');
  const seed = seedRaw !== null && /^\d+$/.test(seedRaw) ? Number(seedRaw) : null;
  return { slug, seed };
}

function GamePage() {
  const path = useHashRoute();
  const { slug, seed } = useMemo(() => getSlugAndSeed(path), [path]);

  useEffect(() => {
    if (slug !== null && slug !== 'fall-f') {
      navigate('/game');
    }
  }, [slug]);

  if (slug === null) {
    return <CatalogPage />;
  }

  if (slug === 'fall-f') {
    return <FallFGame seed={seed} />;
  }

  return <CatalogPage />;
}

export default GamePage;
