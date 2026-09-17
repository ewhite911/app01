import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSubState, SubState } from './purchases';

type Ctx = SubState & { refresh: () => Promise<void> };

const SubContext = createContext<Ctx>({ mode: 'mock', active: false, trialEnd: null, refresh: async () => {} });

export function SubProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubState>({ mode: 'mock', active: false, trialEnd: null });
  const refresh = useCallback(async () => {
    try {
      setState(await getSubState());
    } catch {
      /* keep previous state */
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return <SubContext.Provider value={{ ...state, refresh }}>{children}</SubContext.Provider>;
}

export const useSub = () => useContext(SubContext);
