import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Warning, Spinner } from "@phosphor-icons/react";
import prettyBytes from "pretty-bytes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFileMetadata, getPresignedDownloadUrl } from "@/lib/server-fns";

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
    return <ErrorState message={data.error} />;
  }

  return <FileDetails file={data.file} id={id} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Warning className="h-6 w-6 text-destructive" weight="bold" />
            </div>
            <CardTitle>File not found</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            The file may have expired or the link is invalid.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface FileDetailsProps {
  file: {
    id: string;
    originalName: string;
    contentType: string;
    size: number;
    createdAt: Date;
    expiresAt: Date;
    downloadCount: number;
  };
  id: string;
}

function FileDetails({ file, id }: FileDetailsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
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

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="break-all">{file.originalName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{prettyBytes(file.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">{file.contentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">
                {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Expires</p>
              <p className="font-medium">
                {new Date(file.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Spinner className="mr-2 h-5 w-5 animate-spin" />
                Preparing download...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
