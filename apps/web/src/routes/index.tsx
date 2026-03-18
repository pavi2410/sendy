import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { generate } from "random-words";
import { ArrowRight, Check, Copy, Spinner, Upload } from "@phosphor-icons/react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPresignedUploadUrl } from "@/lib/server-fns";
import { DEFAULT_EXPIRATION_DAYS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@sendy/db/config";

export const Route = createFileRoute("/")({ component: UploadPage });

function UploadPage() {
  const id = useMemo(() => generate({ exactly: 3, join: "-" }), []);
  const [uploadResult, setUploadResult] = useState<{ shortCode: string } | null>(null);

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col gap-8 md:flex-row md:items-start md:gap-0">
        <div className="flex-1 md:pr-10">
          <FileLookup />
        </div>
        <div className="hidden md:block self-stretch w-px bg-border" />
        <hr className="md:hidden border-border" />
        <div className="flex-1 md:pl-10">
          {uploadResult ? (
            <UploadSuccess id={id} shortCode={uploadResult.shortCode} />
          ) : (
            <UploadForm id={id} onSuccess={(result) => setUploadResult(result)} />
          )}
        </div>
      </div>
    </div>
  );
}

function FileLookup() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      navigate({ to: "/dl/$id", params: { id: trimmed } });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">Retrieve</h2>
        <p className="text-xs text-muted-foreground">Enter a code to download</p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="e.g. apple-banana-cherry"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-9 text-sm"
        />
        <Button type="submit" disabled={!code.trim()} size="sm" className="shrink-0">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function UploadForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (result: { shortCode: string }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [expirationDays, setExpirationDays] = useState(DEFAULT_EXPIRATION_DAYS);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const { uploadUrl, shortCode } = await getPresignedUploadUrl({
          data: {
            id,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            expirationDays,
          },
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Upload failed with status ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        onSuccess({ shortCode });
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [id, expirationDays, onSuccess],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">Upload</h2>
        <p className="text-xs text-muted-foreground">
          Share anonymously · Max {MAX_FILE_SIZE_MB}MB
        </p>
      </div>

      <div
        className={`flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors ${
          dragOver
            ? "border-foreground bg-muted"
            : "border-muted-foreground/30 hover:border-muted-foreground/60"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <div className="flex w-full flex-col items-center gap-2 px-6">
            <Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">Drop or click to upload</p>
            <p className="text-[10px] text-muted-foreground">Paste with Ctrl+V</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Expires in</span>
        <Input
          type="number"
          min={1}
          max={365}
          value={expirationDays}
          onChange={(e) => setExpirationDays(Number(e.target.value))}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">days</span>
      </div>
    </div>
  );
}

function UploadSuccess({ id, shortCode }: { id: string; shortCode: string }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const wordUrl = `${baseUrl}/dl/${id}`;
  const codeUrl = `${baseUrl}/dl/${shortCode}`;
  const [copiedWord, setCopiedWord] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyWordUrl = async () => {
    await navigator.clipboard.writeText(wordUrl);
    setCopiedWord(true);
    setTimeout(() => setCopiedWord(false), 2000);
  };

  const copyCodeUrl = async () => {
    await navigator.clipboard.writeText(codeUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-600" weight="bold" />
        <h2 className="text-sm font-medium text-foreground">Uploaded</h2>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Word link</label>
        <div className="flex gap-1.5">
          <Input value={wordUrl} readOnly className="h-8 text-xs" />
          <Button variant="ghost" size="sm" onClick={copyWordUrl} className="h-8 w-8 shrink-0 p-0">
            {copiedWord ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Short code</label>
        <div className="flex gap-1.5">
          <Input value={codeUrl} readOnly className="h-8 text-xs" />
          <Button variant="ghost" size="sm" onClick={copyCodeUrl} className="h-8 w-8 shrink-0 p-0">
            {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="rounded bg-white p-2">
          <QRCode value={wordUrl} size={100} />
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Upload another
      </button>
    </div>
  );
}
