import { GitHubError } from "@/lib/github";

export function errorMessage(e: unknown): string {
  if (e instanceof GitHubError) return e.message;
  return "Something went wrong talking to GitHub. Try again in a minute.";
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="border border-blue bg-white">
      <div className="bg-blue px-1.5 py-[2px] font-mono text-[9.5px] font-semibold uppercase text-white">Error</div>
      <p className="p-3 font-mono text-[12px] text-blue">{errorMessage(error)}</p>
    </div>
  );
}
