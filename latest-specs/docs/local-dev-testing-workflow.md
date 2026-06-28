# Local Dev & Testing Workflow — OpenLedger

> **Purpose**: Reference for running OpenLedger locally during development.
> Use this when starting a coding session.

---

## Quick Start

```bash
cd /Users/ealastre/Documents/GitHub/openledger

# Primary: Docker Compose (no local Bun required)
make dev          # Hot-reload dev server via Docker
make health       # Verify: {"status":"ok",...}

# Alternative: Host development (requires local Bun)
bun install
bun run dev
```

---

## Development Modes

### Mode 1: Docker Compose — Primary (Recommended)

One command to run the full stack. No local Bun installation required.

#### Production Mode (compiled binary)

```bash
make up            # Build + start detached
make health        # Verify health endpoint
make graphql       # Verify GraphQL
make logs          # Follow container logs
make down          # Stop
```

#### Dev Mode (hot reload)

```bash
make dev           # Start with hot reload (foreground)
make dev-detach    # Start with hot reload (detached)
make dev-build     # Rebuild + start with hot reload
```

Dev mode uses `docker-compose.dev.yml` which:
- Mounts `./src` and `./test` as bind volumes for live editing
- Runs `bun run --watch` for automatic restart on file changes
- Keeps `node_modules` in a named Docker volume (avoids host/container arch mismatch)

#### Testing via Docker

```bash
make test          # Run bun test inside the dev container
make install       # Install/update dependencies in container
make shell         # Open a shell in the running container
```

### Mode 2: Host Development (Requires Local Bun)

Run Bun directly on the host for fastest iteration:

```bash
bun install        # Install dependencies
bun run dev        # Start with hot reload
bun test           # Run tests
```

- Hot reload on file changes
- GraphQL Playground at http://localhost:4000/graphql
- Health check at http://localhost:4000/health

---

## Makefile Targets Reference

Run `make help` to see all available targets:

| Target | Description |
|--------|-------------|
| `make dev` | Start dev stack with hot reload |
| `make dev-build` | Rebuild + start dev stack |
| `make dev-detach` | Start dev stack detached |
| `make build` | Build production image |
| `make up` | Start production stack (detached, rebuild) |
| `make down` | Stop all containers |
| `make clean` | Tear down + remove volumes and local images |
| `make restart` | Restart production stack |
| `make health` | Health check (curl /health) |
| `make graphql` | Verify GraphQL endpoint |
| `make introspect` | Full GraphQL schema introspection |
| `make test` | Run tests in container |
| `make test-host` | Run tests on host (requires local Bun) |
| `make logs` | Follow container logs |
| `make shell` | Open shell in running container |
| `make install` | Install/update deps in dev container |
| `make ps` | Show running containers |

---

## Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production stack — compiled single binary, health checks, non-root user |
| `docker-compose.dev.yml` | Dev override — hot reload via `bun run --watch`, source bind mounts |
| `Dockerfile` | Multi-stage build: `oven/bun:1` → compile → `debian:bookworm-slim` runtime |

---

## Testing

### Run All Tests

```bash
make test          # Docker (recommended)
bun test           # Host (requires local Bun)
```

### Run Specific Test File

```bash
bun test test/scaffold.test.ts
```

### Conformance Tests

Conformance tests (CT-*) are the SPEC's invariant property-based tests. They are the "done" gate for each epic:

```bash
# Run only conformance tests (once they exist)
bun test test/conformance/
```

---

## Useful GraphQL Queries

### Health Check

```graphql
{
  health {
    status
    heads
    peers
    version
  }
}
```

### Verify DAG Integrity

```graphql
{
  verify {
    ok
    nodesChecked
    errors
  }
}
```

### Trial Balance

```graphql
{
  trialBalance(at: "2026-01-01") {
    at
    totalDebit
    totalCredit
    rows {
      account
      debit
      credit
    }
  }
}
```

### Append Transaction

```graphql
mutation {
  appendTransaction(input: {
    date: "2026-06-27"
    narration: "Office supplies"
    postings: [
      { account: "Expenses:Office", amount: { number: "50.00", currency: "USD" } }
      { account: "Assets:Checking", amount: { number: "-50.00", currency: "USD" } }
    ]
  }) {
    txid
    date
    narration
  }
}
```

---

## File Locations

| What | Path |
|------|------|
| Entry point | `src/index.ts` |
| GraphQL schema | `src/graphql/schema.ts` |
| Custom scalars | `src/graphql/scalars.ts` |
| Ledger logic | `src/ledger/` |
| P2P networking | `src/p2p/` |
| Security | `src/security/` |
| Tests | `test/` |
| App config | `gl-node.config.json` |
| Ledger data | `data/` |
| Docker Compose | `docker-compose.yml` |
| Dev Override | `docker-compose.dev.yml` |
| Makefile | `Makefile` |
| Dockerfile | `Dockerfile` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 4000 in use | `lsof -i :4000` then `kill <PID>`, or `make down` |
| `make dev` fails to start | Run `make clean` then `make dev-build` |
| `bun install` fails (host) | Delete `node_modules` and `bun.lock`, retry |
| Docker build fails | Check Docker is running: `docker info`. Try `make clean && make up` |
| Tests timeout | Ensure server is running (`make health`) before `make test` |
| Hot reload not working | Verify source bind mounts: `docker compose -f docker-compose.yml -f docker-compose.dev.yml config` |
| Container permission error | Volumes need UID 1000 ownership: `sudo chown -R 1000:1000 data/` |
| `node_modules` arch mismatch | Use `make dev` (Docker) instead of host. Docker uses its own `node_modules_dev` volume |
