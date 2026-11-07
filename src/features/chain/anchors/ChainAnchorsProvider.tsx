import { useState, type ReactNode } from 'react';

import { ChainAnchorsContext } from './ChainAnchorsContext';
import { createChainAnchorRegistry } from './registry';

interface ChainAnchorsProviderProps {
  children: ReactNode;
}

/** Wraps a page that shows the chain: its <ChainStage /> and its windows. */
export function ChainAnchorsProvider({ children }: ChainAnchorsProviderProps) {
  const [registry] = useState(createChainAnchorRegistry);
  return <ChainAnchorsContext value={registry}>{children}</ChainAnchorsContext>;
}
