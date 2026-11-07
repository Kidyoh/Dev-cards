import { SearchForm } from "@/components/SearchForm";

export default function NotFound() {
  return (
    <div className="center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <h1>No such developer</h1>
      <p className="muted">That GitHub user doesn&apos;t exist. Try another one.</p>
      <SearchForm />
    </div>
  );
}
