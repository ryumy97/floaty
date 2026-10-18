'use client';

import { Floaty, FloatyAnchor, useFloatyState } from '@ryumy97/floaty-react';
import { type ReactNode, useEffect, useState } from 'react';
import { BlobAnchor } from './blob';

const MAX_COLS = 12;
const MAX_ROWS = 6;

type Position = { x: number; y: number };

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const button =
    'size-7 rounded-lg border bg-fd-card text-sm transition-colors hover:bg-fd-accent disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-fd-muted-foreground">{label}</span>
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={button}
      >
        −
      </button>
      <span className="w-5 text-center tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        +
      </button>
    </div>
  );
}

const FloatContent = () => {
  const state = useFloatyState<{ children: ReactNode }>();

  return <div className="size-4">{state?.children}</div>;
};

/** Live example: one stateful button following two different layouts. */
export function LayoutDemo({ id }: { id?: string }) {
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);
  const [position, setPosition] = useState<Position | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: each new position restarts the timer
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPosition(null);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [position]);

  const resize = (nextCols: number, nextRows: number) => {
    setCols(nextCols);
    setRows(nextRows);
    setPosition((p) => (p && (p.x >= nextCols || p.y >= nextRows) ? null : p));
  };

  return (
    <>
      {id && (
        <Floaty
          floatyId={id}
          className="flex size-full items-center justify-center rounded-2xl bg-float font-medium text-float-foreground shadow-float"
          transition={{ type: 'spring', duration: 450, bounce: 0.2 }}
        >
          <FloatContent />
        </Floaty>
      )}
      <div className="relative w-full flex items-center justify-center h-4">
        {id && !position && (
          <FloatyAnchor
            floatyId={id}
            state={{ children: <div className="" /> }}
            className="size-4"
          />
        )}
        {!id && !position && (
          <BlobAnchor state={{ children: <div className="" /> }} className="size-4" />
        )}
      </div>
      <div className="not-prose my-6 rounded-xl border bg-fd-card p-4">
        <div className="mb-4 flex flex-wrap gap-6">
          <Stepper
            label="Columns"
            value={cols}
            max={MAX_COLS}
            onChange={(value) => resize(value, rows)}
          />
          <Stepper
            label="Rows"
            value={rows}
            max={MAX_ROWS}
            onChange={(value) => resize(cols, value)}
          />
        </div>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: cols * rows }, (_, index) => {
            const x = index % cols;
            const y = Math.floor(index / cols);
            return (
              <button
                type="button"
                key={`${x}-${y}`}
                onClick={() => setPosition({ x, y })}
                className="relative h-40 rounded-2xl border-[1.5px] border-dashed border-anchor bg-anchor-fill font-mono text-sm text-fd-muted-foreground tabular-nums transition-colors hover:border-float/60 cursor-pointer"
              >
                {index}
                {!id && position?.x === x && position.y === y && (
                  <BlobAnchor
                    state={{ children: <>{index}</> }}
                    className="absolute inset-0 size-full"
                  />
                )}
                {id && position?.x === x && position.y === y && (
                  <FloatyAnchor
                    floatyId={id}
                    state={{ children: <>{index}</> }}
                    className="absolute inset-0 size-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
