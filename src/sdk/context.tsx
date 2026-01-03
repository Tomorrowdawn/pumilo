import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type PumiloMode = "edit" | "publish";

export type PumiloDataset = Record<string, string>;

type PumiloContextValue = {
  mode: PumiloMode;
  data: PumiloDataset;
  setField?: (id: string, value: string) => void;
};

const PumiloContext = createContext<PumiloContextValue | null>(null);

export interface PumiloProviderProps {
  mode: PumiloMode;
  /**
   * Initial value snapshot provided by the backend/editor.
   */
  initialData?: PumiloDataset;
  /**
   * Optional callback fired whenever the dataset changes while editing.
   */
  onDatasetChange?: (dataset: PumiloDataset) => void;
  children: ReactNode;
}

export const PumiloProvider = ({
  mode,
  initialData = {},
  onDatasetChange,
  children,
}: PumiloProviderProps) => {
  const [fields, setFields] = useState<PumiloDataset>(initialData);

  useEffect(() => {
    setFields(initialData);
  }, [initialData]);

  const setField = useCallback(
    (id: string, value: string) => {
      if (mode !== "edit") {
        return;
      }

      setFields((prev) => {
        if (prev[id] === value) {
          return prev;
        }

        const next = { ...prev, [id]: value };
        onDatasetChange?.(next);
        return next;
      });
    },
    [mode, onDatasetChange]
  );

  const ctx = useMemo<PumiloContextValue>(
    () => ({
      mode,
      data: fields,
      setField: mode === "edit" ? setField : undefined,
    }),
    [fields, mode, setField]
  );

  return <PumiloContext.Provider value={ctx}>{children}</PumiloContext.Provider>;
};

export const usePumiloContext = () => {
  const ctx = useContext(PumiloContext);
  if (!ctx) {
    throw new Error("usePumiloContext must be used inside <PumiloProvider />");
  }

  return ctx;
};

export type PumiloFieldHandle = {
  mode: PumiloMode;
  value: string;
  setValue: (next: string) => void;
  readOnly: boolean;
};

export const usePumiloField = (id: string): PumiloFieldHandle => {
  const ctx = usePumiloContext();
  const value = ctx.data[id] ?? "";

  return {
    mode: ctx.mode,
    value,
    setValue: (next: string) => ctx.setField?.(id, next),
    readOnly: ctx.mode === "publish" || !ctx.setField,
  };
};

