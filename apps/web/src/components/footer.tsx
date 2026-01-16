export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <a
            href="https://pavi2410.me"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            pavi2410
          </a>
        </p>
        <a
          href="https://github.com/pavi2410/sendy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Source
        </a>
      </div>
    </footer>
  );
}
