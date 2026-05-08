import { useLocation, useNavigate, useRouteError } from 'react-router';
import ErrorFallback from './ErrorFallback';

function RouteErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <ErrorFallback
      error={error instanceof Error ? error : undefined}
      onRetry={() => navigate(location.pathname + location.search, { replace: true })}
    />
  );
}

export default RouteErrorElement;
