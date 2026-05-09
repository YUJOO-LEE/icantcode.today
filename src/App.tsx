import { RouterProvider } from 'react-router';
import type { createBrowserRouter } from 'react-router';
import AppShell from './AppShell';

interface AppProps {
  router: ReturnType<typeof createBrowserRouter>;
}

function App({ router }: AppProps) {
  return (
    <AppShell>
      <RouterProvider router={router} />
    </AppShell>
  );
}

export default App;
