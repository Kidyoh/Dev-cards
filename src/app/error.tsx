"use client";

import { useEffect } from "react";

/** A new deploy can remove the files an already-open page still needs; reloading picks up the new ones. */
function isStaleBuild(error: Error) {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    `${error.name} ${error.message}`,
  );
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (isStaleBuild(error) && !sessionStorage.getItem("specsheet:reloaded")) {
      sessionStorage.setItem("specsheet:reloaded", "1");
      window.location.reload();
    }
  }, [error]);

  return (
    <section className="mx-4 mt-16 max-w-lg sm:mx-6">
      <div className="border border-blue bg-white">
        <div className="bg-blue px-1.5 py-[2px] font-mono text-[9.5px] font-semibold uppercase text-white">Something went wrong</div>
        <div className="p-3 font-mono text-[11px] uppercase leading-snug text-blue">
          <p>The page hit an error. This usually fixes itself with a reload.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => window.location.reload()} className="bg-blue px-2 py-1 font-semibold text-white">Reload</button>
            <button onClick={reset} className="border border-blue px-2 py-1 font-semibold">Try again</button>
          </div>
        </div>
      </div>
    </section>
  );
}
