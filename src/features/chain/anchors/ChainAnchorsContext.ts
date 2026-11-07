import { createContext } from 'react';

import type { ChainAnchorRegistry } from './registry';

export const ChainAnchorsContext = createContext<ChainAnchorRegistry | null>(null);
