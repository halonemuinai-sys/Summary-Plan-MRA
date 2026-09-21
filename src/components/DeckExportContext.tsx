'use client';

import { createContext, useContext } from 'react';

export const DeckExportContext = createContext<'highlights' | 'percentage' | 'value' | null>(null);
export const useDeckExport = () => useContext(DeckExportContext);
