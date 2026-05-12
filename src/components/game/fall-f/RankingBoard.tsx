import { useTranslation } from 'react-i18next';
import { useRanking } from '@/apis/queries/useGames';
import type { RankingItem } from '@/types/api';

interface RankingBoardProps {
  /** Number of entries to request. Mirrors the API `limit` query param. */
  limit?: number;
  className?: string;
}

function StatusLine({ children, live = false }: { children: string; live?: boolean }) {
  return (
    <p
      className="text-muted-foreground/50"
      {...(live ? { role: 'status' as const, 'aria-live': 'polite' as const } : {})}
    >
      # {children}
    </p>
  );
}

function RankRow({ item }: { item: RankingItem }) {
  const isTop = item.rank === 1;
  return (
    <li className="grid grid-cols-[2ch_1fr_auto] items-baseline gap-x-2">
      <span className={`text-right ${isTop ? 'text-primary' : 'text-muted-foreground'}`}>
        {item.rank}
      </span>
      <span className={`truncate ${isTop ? 'text-primary' : ''}`}>{item.nickname}</span>
      <span className={isTop ? 'text-primary' : 'text-foreground'}>{item.score}</span>
    </li>
  );
}

function RankingBoard({ limit = 10, className = '' }: RankingBoardProps) {
  const { t } = useTranslation('game');
  const { data, isPending, isError } = useRanking(limit);
  const list = data?.list ?? [];

  let body;
  if (isPending) {
    body = <StatusLine live>{t('ranking.loading')}</StatusLine>;
  } else if (isError) {
    body = <StatusLine>{t('ranking.error')}</StatusLine>;
  } else if (list.length === 0) {
    body = <StatusLine>{t('ranking.empty')}</StatusLine>;
  } else {
    body = (
      <ol className="space-y-0">
        {list.map((item) => (
          <RankRow key={`${item.rank}-${item.nickname}`} item={item} />
        ))}
      </ol>
    );
  }

  return (
    <section
      aria-label={t('ranking.header')}
      className={`border border-border p-3 font-mono text-xs ${className}`}
    >
      <p className="text-muted-foreground mb-2">── {t('ranking.header')} ──</p>
      {body}
    </section>
  );
}

export default RankingBoard;
