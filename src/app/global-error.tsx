"use client";

import { useEffect } from "react";

/** Last-resort boundary (errors in the layout itself). Reload once for stale-deploy chunk errors. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(`${error.name} ${error.message}`) && !sessionStorage.getItem("specsheet:reloaded")) {
      sessionStorage.setItem("specsheet:reloaded", "1");
      window.location.reload();
    }
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "monospace", color: "#2f3fc2", padding: 24 }}>
        <p>SPECSHEET HIT AN ERROR.</p>
        <button onClick={() => window.location.reload()} style={{ background: "#2f3fc2", color: "#fff", border: 0, padding: "6px 10px" }}>
          RELOAD
        </button>
      </body>
    </html>
  );
}
