import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-center gap-2 px-4">
      <img src="/icon-192.png" alt="Sendy logo" className="h-6 w-6 rounded" />
      <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
        sendy
      </Link>
    </header>
  );
}
