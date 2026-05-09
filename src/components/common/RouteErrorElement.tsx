import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router';
import ErrorFallback from './ErrorFallback';

function RouteErrorElement() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  let normalized: Error | undefined;
  if (error instanceof Error) {
    normalized = error;
  } else if (isRouteErrorResponse(error)) {
    normalized = new Error(`${error.status} ${error.statusText}`);
  }

  return (
    <ErrorFallback
      error={normalized}
      onRetry={() => navigate(location.pathname + location.search, { replace: true })}
    />
  );
}

export default RouteErrorElement;
