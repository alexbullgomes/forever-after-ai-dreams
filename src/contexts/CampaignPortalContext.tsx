import React, { createContext, useContext } from 'react';

const CampaignPortalContext = createContext<HTMLElement | null>(null);

interface CampaignPortalProviderProps {
  container: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

export function CampaignPortalProvider({ container, children }: CampaignPortalProviderProps) {
  return (
    <CampaignPortalContext.Provider value={container.current}>
      {children}
    </CampaignPortalContext.Provider>
  );
}

export function useCampaignPortal(): HTMLElement | undefined {
  const container = useContext(CampaignPortalContext);
  return container ?? undefined;
}
