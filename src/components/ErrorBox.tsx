import { GitHubError } from "@/lib/github";

export function errorMessage(e: unknown): string {
  if (e instanceof GitHubError) return e.message;
  return "Something went wrong talking to GitHub. Try again in a minute.";
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-[#d9412b]/40 bg-[#d9412b]/10 p-5 font-mono text-sm text-[#8a2414]">
      <span className="mr-2 font-bold uppercase tracking-[0.14em]">Error ·</span>
      {errorMessage(error)}
    </div>
  );
}
