import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { generate } from "random-words";
import { Copy, Check, Upload, Spinner } from "@phosphor-icons/react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel } from "@/components/ui/field";
import { getPresignedUploadUrl } from "@/lib/server-fns";
import { MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, DEFAULT_EXPIRATION_DAYS } from "@sendy/db/config";

export const Route = createFileRoute("/")({ component: UploadPage });

function UploadPage() {
  const id = useMemo(() => generate({ exactly: 3, join: "-" }), []);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      {uploaded ? (
        <UploadSuccess id={id} />
      ) : (
        <UploadForm id={id} onSuccess={() => setUploaded(true)} />
      )}
    </div>
  );
}

function UploadForm({ id, onSuccess }: { id: string; onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expirationDays, setExpirationDays] = useState(DEFAULT_EXPIRATION_DAYS);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setUploading(true);

      try {
        const { uploadUrl } = await getPresignedUploadUrl({
          data: {
            id,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            expirationDays,
          },
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        onSuccess();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [id, expirationDays, onSuccess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a file</CardTitle>
        <CardDescription>
          Share files anonymously. Max size: {MAX_FILE_SIZE_MB}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
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
            <>
              <Spinner className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-lg font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                Drop a file here or click to select
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Or paste from clipboard (Ctrl+V)
              </p>
            </>
          )}
        </div>

        <Field>
          <FieldLabel>Expires after (days)</FieldLabel>
          <Input
            type="number"
            min={1}
            max={365}
            value={expirationDays}
            onChange={(e) => setExpirationDays(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Default: {DEFAULT_EXPIRATION_DAYS} days (1 year)
          </p>
        </Field>
      </CardContent>
    </Card>
  );
}

function UploadSuccess({ id }: { id: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/${id}` : `/${id}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-6 w-6 text-green-500" weight="bold" />
          </div>
          <CardTitle>File uploaded!</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Download Link</Label>
          <div className="flex gap-2">
            <Input value={url} readOnly />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-lg bg-white p-4">
            <QRCode value={url} size={200} />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <button
            onClick={() => window.location.reload()}
            className="underline hover:text-foreground"
          >
            Refresh
          </button>{" "}
          this page to upload a new file.
        </p>
      </CardContent>
    </Card>
  );
}