import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_STORAGE_KEY = 'cookie_consent_v1';

type ConsentChoice = 'necessary' | 'all';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedChoice = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (storedChoice === 'necessary' || storedChoice === 'all') {
      return;
    }

    setIsVisible(true);
  }, []);

  const handleConsent = (choice: ConsentChoice) => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-kibo-purple/20 bg-gradient-to-r from-kibo-purple to-kibo-purple/90 text-white shadow-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed">
          We use cookies to keep your session secure and improve site functionality. Review our{' '}
          <Link to="/privacy-policy" className="font-semibold underline underline-offset-4 hover:text-kibo-orange">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleConsent('necessary')}
            className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Necessary Only
          </Button>
          <Button
            type="button"
            onClick={() => handleConsent('all')}
            className="bg-kibo-orange text-kibo-purple hover:bg-kibo-orange/90"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
