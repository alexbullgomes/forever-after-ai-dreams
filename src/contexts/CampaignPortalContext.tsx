import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

const CampaignPortalContext = createContext<HTMLElement | null>(null);

interface CampaignPortalProviderProps {
  container: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

export function CampaignPortalProvider({ container, children }: CampaignPortalProviderProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setElement(container.current);
  }, [container]);

  return (
    <CampaignPortalContext.Provider value={element}>
      {children}
    </CampaignPortalContext.Provider>
  );
}

export function useCampaignPortal(): HTMLElement | undefined {
  const container = useContext(CampaignPortalContext);
  return container ?? undefined;
}
