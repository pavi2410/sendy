import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Shield,
  ShieldCheck,
  ShieldSlash,
  ShieldWarning,
  Spinner,
  Warning,
} from "@phosphor-icons/react";
import prettyBytes from "pretty-bytes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFileMetadata, getPresignedDownloadUrl, requeueScan } from "@/lib/server-fns";
import type { File, Scan } from "@sendy/db";

const STALE_THRESHOLD_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;
const CONFIRM_PHRASE = "download anyway";

type Verdict = "pending" | "clean" | "suspicious" | "malicious" | "failed";

export const Route = createFileRoute("/dl/$id")({
  component: DownloadPage,
  loader: async ({ params }) => {
    const result = await getFileMetadata({ data: params.id });
    return result;
  },
});

function DownloadPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();

  if ("error" in data) {
    return <ErrorState message={data.error ?? "Unknown error"} />;
  }

  return <FileDetails file={data.file} initialScan={data.latestScan} id={id} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <Warning className="mx-auto h-8 w-8 text-muted-foreground" weight="bold" />
        <h2 className="text-base font-medium">File not found</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          The file may have expired or the link is invalid.
        </p>
      </div>
    </div>
  );
}

interface FileDetailsProps {
  file: File;
  initialScan: Scan | null;
  id: string;
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (verdict === "clean") {
    return (
      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 gap-1.5">
        <ShieldCheck className="h-3 w-3" weight="fill" />
        Verified clean
      </Badge>
    );
  }
  if (verdict === "suspicious") {
    return (
      <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 gap-1.5">
        <ShieldWarning className="h-3 w-3" weight="fill" />
        Flagged as suspicious
      </Badge>
    );
  }
  if (verdict === "malicious") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <ShieldSlash className="h-3 w-3" weight="fill" />
        Malicious file
      </Badge>
    );
  }
  if (verdict === "failed") {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <Shield className="h-3 w-3" />
        Scan failed
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1.5">
      <Spinner className="h-3 w-3 animate-spin" />
      Verification in progress
    </Badge>
  );
}

function FileDetails({ file, initialScan, id }: FileDetailsProps) {
  const [scan, setScan] = useState<Scan | null>(initialScan);
  const [downloading, setDownloading] = useState(false);
  const [requeuing, setRequeuing] = useState(false);
  const [suspiciousOpen, setSuspiciousOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const requeuedForScanRef = useRef<number | null>(null);

  const verdict: Verdict = (scan?.verdict as Verdict) ?? "pending";
  const isTerminal = verdict === "clean" || verdict === "suspicious" || verdict === "malicious";

  const pollScan = useCallback(async () => {
    const result = await getFileMetadata({ data: id });
    if ("error" in result) return;
    setScan(result.latestScan);
  }, [id]);

  useEffect(() => {
    if (isTerminal) return;
    const interval = setInterval(pollScan, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isTerminal, pollScan]);

  useEffect(() => {
    if (verdict !== "pending" && verdict !== "failed") return;
    if (!scan) return;
    const age = Date.now() - new Date(scan.scannedAt).getTime();
    if (age < STALE_THRESHOLD_MS) return;
    if (requeuedForScanRef.current === scan.id) return;

    requeuedForScanRef.current = scan.id;
    setRequeuing(true);
    requeueScan({ data: id }).finally(() => setRequeuing(false));
  }, [verdict, scan, id]);

  const doDownload = async () => {
    setDownloading(true);
    try {
      const result = await getPresignedDownloadUrl({ data: id });
      if ("error" in result) {
        alert(result.error);
        return;
      }
      window.location.href = result.downloadUrl;
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    if (verdict === "suspicious") {
      setSuspiciousOpen(true);
    } else {
      doDownload();
    }
  };

  const reasons: string[] = scan?.reasons ? JSON.parse(scan.reasons) : [];

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <h2 className="text-base font-medium break-all">{file.originalName}</h2>
          <div className="mt-1.5">
            <VerdictBadge verdict={verdict} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">3-Word Code</p>
            <p className="font-medium font-mono text-sm">{file.id}</p>
          </div>
          {file.shortCode && (
            <div>
              <p className="text-xs text-muted-foreground">Shortcode</p>
              <p className="font-medium font-mono text-sm">{file.shortCode}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-medium text-sm">{prettyBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium text-sm">{file.contentType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uploaded</p>
            <p className="font-medium text-sm">{new Date(file.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="font-medium text-sm">{new Date(file.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>

        {verdict === "malicious" ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2 font-medium mb-1">
              <ShieldSlash className="h-4 w-4" weight="fill" />
              This file has been removed
            </div>
            <p className="text-xs text-destructive/80">
              Our security scan detected this file as malicious. It has been flagged for deletion
              and is no longer available for download.
            </p>
          </div>
        ) : (
          <>
            {(verdict === "pending" || verdict === "failed") && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-2 font-medium mb-0.5 text-xs">
                  <ShieldWarning className="h-4 w-4" weight="fill" />
                  {requeuing ? "Re-queuing scan…" : "Verification in progress"}
                </div>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
                  This file has not been verified yet. Download at your own risk.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleDownloadClick}
              disabled={downloading}
              variant={verdict === "suspicious" ? "destructive" : "default"}
            >
              {downloading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Preparing download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {verdict === "suspicious" ? "Download (suspicious)" : "Download"}
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={suspiciousOpen} onOpenChange={setSuspiciousOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <ShieldWarning className="h-5 w-5" weight="fill" />
              Suspicious file warning
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Suspicious file download confirmation
            </AlertDialogDescription>
            <div className="space-y-3 text-left text-sm">
              <p className="text-muted-foreground">
                Our security scan flagged this file as{" "}
                <strong className="text-foreground">suspicious</strong>. It may contain harmful
                content.
              </p>
              {reasons.length > 0 && (
                <div className="rounded-md bg-muted p-3 text-xs font-mono space-y-1">
                  {reasons.map((r, i) => (
                    <div key={i} className="text-muted-foreground">
                      {r}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-muted-foreground">
                To confirm, type{" "}
                <strong className="font-mono text-foreground">{CONFIRM_PHRASE}</strong> below:
              </p>
              <Input
                placeholder={CONFIRM_PHRASE}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                autoFocus
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSuspiciousOpen(false);
                setConfirmInput("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmInput.toLowerCase() !== CONFIRM_PHRASE || downloading}
              onClick={() => {
                setSuspiciousOpen(false);
                setConfirmInput("");
                doDownload();
              }}
            >
              {downloading ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
              Download anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
