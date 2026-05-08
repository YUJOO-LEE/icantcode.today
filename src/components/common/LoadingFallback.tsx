import Cursor from '@/components/ui/Cursor';
import Logo from '@/components/ui/Logo';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
      <Logo size={48} animate />
      <p className="text-xs text-muted-foreground">
        loading... <Cursor />
      </p>
    </div>
  );
}

export default LoadingFallback;
