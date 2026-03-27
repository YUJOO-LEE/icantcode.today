import { useStatusStore } from '@/stores/statusStore';

function ModelStatusLine() {
  const models = useStatusStore((s) => s.models);

  if (models.length === 0) return null;

  return (
    <div className="text-xs text-muted-foreground">
      <span className="text-foreground">$</span> status --models{' '}
      {models.map((m, i) => (
        <span key={m.model}>
          {i > 0 && <span className="mx-1">·</span>}
          <span className={m.status === 'HEALTHY' ? 'text-muted-foreground' : 'text-destructive'}>
            {m.model}
          </span>
          {m.status !== 'HEALTHY' && (
            <span className="text-destructive"> [FAIL]</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default ModelStatusLine;
