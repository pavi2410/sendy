export function Footer() {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-center gap-3 px-4 text-xs text-muted-foreground">
      <a
        href="https://pavi2410.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground"
      >
        pavi2410
      </a>
      <span>·</span>
      <a
        href="https://github.com/pavi2410/sendy"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground"
      >
        source
      </a>
      <span>·</span>
      <a
        href={`https://github.com/pavi2410/sendy/commit/${__COMMIT_HASH__}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono hover:text-foreground"
      >
        {__COMMIT_HASH__}
      </a>
    </footer>
  );
}
