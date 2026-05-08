import { useEffect } from 'react';
import i18n from '@/lib/i18n';

// SSR / first-client commit always render in `en` (deterministic).
// After first commit, swap to `ko` if the browser language is Korean.
//
// IMPORTANT: this component MUST be placed inside the same Suspense boundary
// as the route subtree (i.e. next to <Outlet />). React 19 hydrates the
// Suspense outside first, then the inside as a second pass — if this lived
// outside the boundary, its effect would run before route components mount
// and the swap would land before the first route render, producing a
// hydration mismatch.
function LanguageInitializer() {
  useEffect(() => {
    if (navigator.language?.startsWith('ko') && i18n.language !== 'ko') {
      void i18n.changeLanguage('ko');
    }
  }, []);
  return null;
}

export default LanguageInitializer;
