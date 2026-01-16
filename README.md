# Sendy

Anonymous file sharing service.

## Tech Stack

- **Framework**: TanStack Start (React)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: PostgreSQL + Drizzle ORM
- **Storage**: Railway Bucket (S3-compatible)
- **Hosting**: Railway

## Project Structure

```
sendy/
├── apps/
│   ├── web/          # TanStack Start web app
│   └── cron/         # Garbage collection script
├── packages/
│   ├── db/           # Drizzle schema and client
│   └── storage/      # S3 client for Railway Bucket
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL database
- S3-compatible storage (Railway Bucket)

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Database Setup

```bash
# Generate migrations
bun run db:generate

# Push schema to database
bun run db:push
```

### Development

```bash
# Start development server
bun run dev
```

### Garbage Collection

Run the garbage collection script to clean up expired files:

```bash
bun run --filter @sendy/cron gc
```

On Railway, set up a cron job to run this periodically (e.g., hourly).

## Configuration

Configuration constants are in `packages/db/src/config.ts`:

- `DEFAULT_EXPIRATION_DAYS`: Default file expiration (365 days)
- `MAX_FILE_SIZE_MB`: Maximum upload size (50 MB)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_REGION` | S3 region (default: `auto`) |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_BUCKET_NAME` | S3 bucket name |

## License

MIT
