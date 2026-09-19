export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] w-full rounded-2xl bg-panel2 ring-1 ring-line" />
          <div className="mt-3 h-4 w-3/4 rounded-md bg-panel2" />
          <div className="mt-2 h-3 w-1/2 rounded-md bg-panel2" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative flex min-h-[92vh] w-full items-center overflow-hidden bg-coal">
      <div className="dot-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-7xl animate-pulse px-4 pt-36 sm:px-6">
        <div className="h-6 w-40 rounded-full bg-panel2" />
        <div className="mt-5 h-14 w-3/4 max-w-xl rounded-2xl bg-panel2 sm:h-20" />
        <div className="mt-3 h-14 w-1/2 max-w-md rounded-2xl bg-panel2 sm:h-20" />
        <div className="mt-5 flex gap-3">
          <div className="h-5 w-24 rounded-md bg-panel2" />
          <div className="h-5 w-16 rounded-md bg-panel2" />
          <div className="h-5 w-20 rounded-md bg-panel2" />
        </div>
        <div className="mt-5 h-4 w-full max-w-lg rounded-md bg-panel2" />
        <div className="mt-2 h-4 w-2/3 max-w-md rounded-md bg-panel2" />
        <div className="mt-7 flex gap-3">
          <div className="h-[52px] w-44 rounded-full bg-panel2" />
          <div className="h-[52px] w-40 rounded-full bg-panel2" />
          <div className="h-[52px] w-[52px] rounded-full bg-panel2" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-ink/70">
        <div className="no-scrollbar mx-auto flex max-w-7xl animate-pulse gap-2 overflow-hidden px-4 py-3 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex min-w-[190px] flex-1 items-center gap-3 rounded-xl p-2">
              <div className="h-12 w-9 shrink-0 rounded-md bg-panel2" />
              <div className="flex-1">
                <div className="h-3.5 w-3/4 rounded bg-panel2" />
                <div className="mt-2 h-3 w-1/2 rounded bg-panel2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RailSkeleton() {
  return (
    <section className="mx-auto max-w-7xl animate-pulse px-4 py-14 sm:px-6">
      <div className="h-4 w-40 rounded bg-panel2" />
      <div className="mt-3 h-9 w-72 rounded-xl bg-panel2" />
      <div className="no-scrollbar mt-7 flex gap-5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 items-end">
            <div className="mr-2 h-32 w-14 rounded-xl bg-panel2" />
            <div className="aspect-[2/3] w-[150px] rounded-xl bg-panel2 ring-1 ring-line sm:w-[188px]" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlockSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-14 sm:px-6">
      <div className="h-9 w-64 rounded-xl bg-panel2" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-panel2 ring-1 ring-line" />
        ))}
      </div>
    </div>
  );
}
