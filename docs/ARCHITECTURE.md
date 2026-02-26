# Sendy — System Architecture

## Overview

Sendy is an anonymous file sharing service built on Railway. Files are uploaded directly to S3-compatible storage, scanned asynchronously for malware, and shared via short codes or 3-word IDs.

---

## System Diagram

```mermaid
graph TD
    subgraph Browser["Browser (Client)"]
        UI_Upload["Upload Page"]
        UI_Download["Download Page"]
    end

    subgraph Web["apps/web (Railway)"]
        ServerFns["Server Functions<br>(TanStack Start)"]
        Queue_Client["BullMQ Queue Client"]
    end

    subgraph Scanner["apps/scanner (Railway)"]
        Worker["BullMQ Worker"]
        Pompelmi["pompelmi scanner"]
    end

    subgraph Infra["Infrastructure (Railway)"]
        Postgres[("PostgreSQL<br>(files + scans tables)")]
        Redis[("Redis<br>(BullMQ queue)")]
        S3["Railway Bucket<br>(S3-compatible)"]
    end

    subgraph Cron["apps/cron (Railway Schedule)"]
        GC["Garbage Collector<br>(deletes expired files)"]
    end

    UI_Upload -- "1. request presigned URL + insert pending scan row" --> ServerFns
    ServerFns -- "2. generate presigned PUT URL" --> S3
    ServerFns -- "3. enqueue scan job" --> Redis
    ServerFns -- "INSERT files + scans(pending)" --> Postgres
    UI_Upload -- "4. PUT file directly" --> S3

    UI_Download -- "poll getFileMetadata every 2s" --> ServerFns
    ServerFns -- "SELECT latest scan row" --> Postgres
    ServerFns -- "requeueScan (if stalled >30s)" --> Redis

    Redis -- "dequeue job" --> Worker
    Worker -- "download file" --> S3
    Worker --> Pompelmi
    Pompelmi -- "verdict: clean/suspicious/malicious" --> Worker
    Worker -- "INSERT scans row<br>UPDATE files.expiresAt (if needed)" --> Postgres

    GC -- "DELETE expired files from S3 + DB" --> S3
    GC --> Postgres
```

---

## Upload Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Web as Web Server
    participant DB as PostgreSQL
    participant Redis
    participant S3

    Browser->>Web: POST getPresignedUploadUrl(id, fileName, ...)
    Web->>DB: INSERT files (id, s3Key, expiresAt, ...)
    Web->>DB: INSERT scans (fileId, verdict='pending')
    Web->>Redis: BullMQ.add('file-scan', {fileId, s3Key})
    Web-->>Browser: { uploadUrl, shortCode }
    Browser->>S3: PUT file (direct, presigned URL)
    Browser-->>Browser: Show success + share links
```

---

## Scan Flow

```mermaid
sequenceDiagram
    participant Redis
    participant Scanner as Scanner Worker
    participant S3
    participant DB as PostgreSQL

    Redis->>Scanner: dequeue job {fileId, s3Key}
    Scanner->>DB: SELECT files WHERE id=fileId
    alt file expired
        Scanner-->>DB: skip (no update)
    else file valid
        Scanner->>S3: GET file as buffer
        Scanner->>Scanner: pompelmi.scan(buffer)
        alt clean
            Scanner->>DB: INSERT scans(verdict='clean')
        else suspicious
            Scanner->>DB: INSERT scans(verdict='suspicious')
            Scanner->>DB: UPDATE files SET expiresAt=now+1hr
        else malicious
            Scanner->>DB: INSERT scans(verdict='malicious')
            Scanner->>DB: UPDATE files SET expiresAt=now
        end
    end
    alt scanner error (after max retries)
        Scanner->>DB: INSERT scans(verdict='failed')
    end
```

---

## Download Page — Verdict UX

```mermaid
flowchart TD
    Load["Load /dl/:id"] --> GetMeta["getFileMetadata()"]
    GetMeta --> CheckVerdict{latestScan.verdict}

    CheckVerdict -- pending/failed --> ShowCaution["Show amber caution banner<br>Allow download<br>Poll every 2s"]
    ShowCaution --> Stale{age > 30s?}
    Stale -- yes --> Requeue["requeueScan() — high priority"]
    Stale -- no --> Poll["Continue polling"]

    CheckVerdict -- clean --> ShowClean["Show green badge<br>Normal download"]

    CheckVerdict -- suspicious --> ShowSuspicious["Show orange badge<br>Download button (destructive)"]
    ShowSuspicious --> Dialog["Confirmation dialog<br>Show scan reasons<br>Type 'download anyway'"]
    Dialog -- confirmed --> Download["Proceed with download"]

    CheckVerdict -- malicious --> Blocked["Show red badge<br>Blocked — file removed message<br>No download button"]
```

---

## Data Model

```mermaid
erDiagram
    files {
        text id PK
        text short_code UK
        text original_name
        text content_type
        integer size
        text s3_key
        timestamp created_at
        timestamp expires_at
        integer download_count
    }

    scans {
        bigint id PK "generated always as identity"
        text file_id FK
        text verdict "pending|clean|suspicious|malicious|failed"
        text reasons "JSON array (nullable)"
        timestamp scanned_at
        integer priority
    }

    files ||--o{ scans : "has many"
```

---

## Services

| Service          | Runtime                | Role                                          |
| ---------------- | ---------------------- | --------------------------------------------- |
| `apps/web`       | Bun + TanStack Start   | Web UI + server functions + queue enqueuer    |
| `apps/scanner`   | Bun                    | BullMQ worker — downloads, scans, updates DB  |
| `apps/cron`      | Bun (Railway Schedule) | GC — deletes expired files from S3 + DB       |
| Railway Redis    | Redis                  | BullMQ job queue (reusable for caching later) |
| Railway Postgres | PostgreSQL             | `files` + `scans` tables                      |
| Railway Bucket   | S3-compatible          | File storage                                  |

---

## Scan Verdict Lifecycle

| Verdict      | Meaning                     | Download                     | Expiry impact                  |
| ------------ | --------------------------- | ---------------------------- | ------------------------------ |
| `pending`    | Queued, not yet scanned     | Allowed (caution)            | None                           |
| `clean`      | Passed all scanners         | Normal                       | None                           |
| `suspicious` | Heuristic flags raised      | Allowed (typed confirmation) | `expiresAt = now + 1hr`        |
| `malicious`  | Definitive threat detected  | **Blocked**                  | `expiresAt = now` (GC deletes) |
| `failed`     | Scanner error after retries | Allowed (caution)            | None                           |
