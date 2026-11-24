import { useEffect } from 'react';
import { keepAwake, privacyScreen } from '../native/feel';

/** On the test screen: keep the screen awake and (optionally, admin setting) block screenshots. */
export function useTestScreen(blockScreenshots = false) {
  useEffect(() => {
    void keepAwake(true); if (blockScreenshots) void privacyScreen(true);
    return () => { void keepAwake(false); if (blockScreenshots) void privacyScreen(false); };
  }, [blockScreenshots]);
}
