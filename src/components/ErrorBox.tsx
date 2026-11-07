import { GitHubError } from "@/lib/github";

export function errorMessage(e: unknown): string {
  if (e instanceof GitHubError) return e.message;
  return "Something went wrong talking to GitHub. Try again in a minute.";
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="error">{errorMessage(error)}</div>;
}
