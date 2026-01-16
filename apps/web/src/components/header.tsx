import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-center gap-3 px-4">
        <img src="/icon-192.png" alt="Sendy logo" className="h-8 w-8 rounded" />
        <Link to="/" className="text-2xl font-bold">
          sendy
        </Link>
      </div>
    </header>
  );
}
