# SaveMyStomach — End-to-End Causal Chain

How code becomes a running system and how data flows from resident demand to trader delivery.

---

## 1. Developer Pushes to `master`

```
Developer laptop
    │
    │  git push origin master
    ▼
GitHub (keanucz/savemystomach)
    │
    │  on: push to master
    ▼
GitHub Actions: "Build and Deploy" workflow
```

The workflow (`.github/workflows/deploy.yml`) has two jobs:

1. **build-and-push** — builds the Docker image and pushes to GHCR
2. **deploy** — calls the Komodo API to trigger a redeploy

---

## 2. Docker Image Build and Push

```
┌─────────────────────────────────────────────────────┐
│  GitHub Actions Runner (ubuntu-latest)               │
│                                                      │
│  1. Checkout code                                    │
│  2. Login to ghcr.io (GITHUB_TOKEN)                  │
│  3. docker/metadata-action → tags:                   │
│       - ghcr.io/keanucz/savemystomach:latest         │
│       - ghcr.io/keanucz/savemystomach:sha-abc123     │
│  4. docker/build-push-action:                        │
│       Multi-stage build (Dockerfile):                │
│         deps   → npm ci --omit=dev                   │
│         builder→ npm ci + npm run build              │
│         runner → node:20-alpine, standalone output   │
│  5. Push image to GHCR                               │
└─────────────────────────────────────────────────────┘
```

The Dockerfile produces a minimal Next.js standalone image (~150MB) running as non-root user `nextjs` on port 3000.

---

## 3. Komodo Deploys the Stack

```
GitHub Actions (deploy job)
    │
    │  POST /execute
    │  { "type": "DeployStack", "params": { "stack": "savemystomach" } }
    │  (authenticated with KOMODO_API_KEY + KOMODO_API_SECRET)
    ▼
Komodo Core (on VPS or management node)
    │
    │  Instructs Komodo Periphery on kiwi (Unraid)
    ▼
Komodo Periphery (kiwi, uid 99:100)
    │
    │  1. cd /mnt/user/appdata/repos/savemystomach
    │  2. git pull (if linked_repo changed)
    │  3. docker compose pull (pulls new ghcr.io image)
    │  4. docker compose up -d
    ▼
┌─────────────────────────────────────────────────────┐
│  Docker on kiwi (Unraid)                             │
│                                                      │
│  Network: savemystomach (bridge)                     │
│                                                      │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │  savemystomach (web) │  │  savemystomach-neo4j │  │
│  │  Next.js on :3000    │  │  Neo4j 5 Community   │  │
│  │  Exposed as :8910    │  │  bolt://neo4j:7687   │  │
│  │  ─────────────────── │  │  ──────────────────  │  │
│  │  Env:                │  │  Env:                │  │
│  │    NEO4J_URI=        │  │    NEO4J_AUTH=       │  │
│  │      bolt://neo4j:   │  │      neo4j/pass      │  │
│  │      7687            │  │    NEO4J_PLUGINS=    │  │
│  │    KIMCHI_BASE_URL   │  │      ["apoc"]        │  │
│  │    KIMCHI_API_KEY    │  │                      │  │
│  └─────────┬───────────┘  └──────────────────────┘  │
│            │                         ▲               │
│            │    bolt://neo4j:7687    │               │
│            └─────────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

Key details from `komodo/resources/main.toml`:
- `server_id = "kiwi"` — runs on the Unraid box
- `auto_update = true` + `poll_for_updates = true` — Komodo also polls GHCR for new images
- Secrets injected via Komodo variables: `[[SAVEMYSTOMACH_NEO4J_PASSWORD]]` etc.

The `web` container waits for neo4j healthcheck (cypher-shell `RETURN 1`) before starting.

---

## 4. Caddy Routes Traffic

```
Internet
    │
    │  https://savemystomach.keanuc.net
    ▼
Caddy (VPS — cloud server)
    │
    │  Caddyfile config:
    │    savemystomach.keanuc.net {
    │      import keanuc-tls          ← TLS via Cloudflare DNS-01
    │      import unraid 8910         ← reverse_proxy 100.85.82.61:8910
    │    }
    │
    │  (unraid) snippet expands to:
    │    reverse_proxy 100.85.82.61:8910
    │
    │  100.85.82.61 = kiwi's Tailscale IP
    ▼
Tailscale tunnel (encrypted, private network)
    │
    ▼
kiwi:8910 → Docker port map → container :3000
    │
    ▼
Next.js App (savemystomach container)
```

The Caddy VPS acts as the public-facing ingress. It holds the TLS cert (Cloudflare DNS challenge) and proxies over Tailscale to the homelab Unraid box. No ports are opened on the home network.

---

## 5. Resident Flow

```
User visits savemystomach.keanuc.net
    │
    ▼ Chooses "I'm a Resident"
    │
    ▼ Enters postcode (e.g. E2 6BG)
    │
    │  POST /api/resident/lookup { postcode: "E2 6BG" }
    ▼
┌──────────────────────────────────────────────────────────┐
│  RESIDENT_LOOKUP_QUERY (Cypher)                           │
│                                                           │
│  MATCH (r:Resident {postcode: $postcode})-[:LIVES_IN]->(l:LSOA)  │
│  OPTIONAL MATCH (t:Trader)-[s:CONFIRMED_STOP]->(l)       │
│  WHERE s.date >= date()                                   │
│  OPTIONAL MATCH (t)-[:SUPPLIES]->(p:Product)             │
│  RETURN lsoa info + upcoming_stops with products         │
└──────────────────────────────────────────────────────────┘
    │
    ▼ Returns: LSOA name/coords + confirmed trader stops + available products
    │
    ▼ Map renders (React-Leaflet + OSM tiles) with stop marker
    │
    ▼ Resident selects products, sets quantities
    │
    │  POST /api/resident/order { postcode, items: [{sku, qty}] }
    ▼
┌──────────────────────────────────────────────────────────┐
│  PLACE_ORDER_MUTATION (Cypher)                            │
│                                                           │
│  MATCH (r:Resident {postcode: $postcode})                │
│  UNWIND $items AS item                                    │
│  MATCH (p:Product {sku: item.sku})                        │
│  CREATE (r)-[:ORDERED {qty, price_pence, status:'pending', placed_at}]->(p)  │
└──────────────────────────────────────────────────────────┘
    │
    ▼ Confirmation: "Van arrives Thursday 5pm"
```

---

## 6. Trader Flow

```
Trader visits savemystomach.keanuc.net
    │
    ▼ Chooses "I'm a Trader"
    │
    │  GET /api/trader/profile?traderId=trader_001
    │  GET /api/trader/infill?traderId=trader_001
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  INFILL_STOPS_QUERY — the "magic" graph query                     │
│                                                                   │
│  For each pair of markets the trader attends on the same day:     │
│                                                                   │
│     Market A ─────────────────── Market B                         │
│         \                           /                             │
│          \  detour via LSOA        /                              │
│           \     must be          /                                │
│            \   < 1.5x direct   /                                  │
│             \   distance      /                                   │
│              ▼               ▼                                    │
│           ┌───────────────────┐                                   │
│           │  Food Desert LSOA │                                   │
│           │  (is_food_desert) │                                   │
│           └────────┬──────────┘                                   │
│                    │                                               │
│  Then: aggregate pending orders from residents in that LSOA       │
│        who want products the trader supplies                      │
│  Filter: demand > GBP 50                                          │
│  Return: ranked by demand (top 5)                                 │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼ Trader sees dashboard: infill stops ranked by demand + GBP value
    │
    ▼ Trader clicks "Accept Stop" on Tower Hamlets (GBP 340, 3 residents)
    │
    │  POST /api/trader/accept-stop
    │  { traderId, lsoaCode, date, scheduledTime, expectedValuePence }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  ACCEPT_STOP_MUTATION (Cypher)                                │
│                                                               │
│  MATCH (t:Trader {id: $traderId}), (l:LSOA {code: $lsoaCode})│
│  CREATE (t)-[:CONFIRMED_STOP {date, scheduled_time,           │
│              expected_value_pence}]->(l)                       │
│  RETURN trader_id, lsoa_code                                  │
└──────────────────────────────────────────────────────────────┘
```

### LLM Features (Kimchi Gateway)

- **Stock recognition**: Trader photographs their van → `POST /api/trader/recognise-stock` → GPT-4o vision identifies products
- **Chat assistant**: `POST /api/trader/chat` → GPT-4o-mini answers route/pricing questions
- Both route through Kimchi (multi-provider LLM gateway with failover)

---

## 7. Neo4j Graph Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                       GRAPH SCHEMA                            │
│                                                              │
│  (:Trader)──[:ATTENDS]──▶(:Market)                          │
│      │                       │                               │
│      │[:SUPPLIES]            │ .day_of_week                  │
│      ▼                       │ .lat/.lng                     │
│  (:Product)                  │ .town                         │
│      ▲                                                       │
│      │[:ORDERED]                                             │
│      │  .qty, .price_pence                                   │
│      │  .status (pending/fulfilled)                          │
│  (:Resident)──[:LIVES_IN]──▶(:LSOA)                         │
│      │                         ▲                             │
│      │ .postcode               │                             │
│                                │[:CONFIRMED_STOP]            │
│                           (:Trader)                           │
│                                │  .date                      │
│                                │  .scheduled_time            │
│                                │  .expected_value_pence      │
└─────────────────────────────────────────────────────────────┘
```

Why a graph database works here:
- The infill query is a **multi-hop traversal** (Trader → Markets → LSOAs → Residents → Products) with geospatial distance filtering
- In SQL this would be multiple JOINs with subqueries; in Cypher it's a single declarative pattern match
- The `CONFIRMED_STOP` relationship is the bridge between supply (traders) and demand (residents)

---

## 8. The Magic Moment

The entire system's value crystallises at this exact point:

```
BEFORE trader accepts:                 AFTER trader accepts:

(:Trader)                              (:Trader)
    │                                      │
    ├─[:ATTENDS]─▶(:Market)               ├─[:ATTENDS]─▶(:Market)
    │                                      │
    └─[:SUPPLIES]─▶(:Product)             ├─[:SUPPLIES]─▶(:Product)
                                           │
                                           └─[:CONFIRMED_STOP]─▶(:LSOA)
                                                                   ▲
                                                                   │
                                              (:Resident)─[:LIVES_IN]─┘
```

**What happens in the graph:**
```
CREATE (t:Trader)-[:CONFIRMED_STOP {
  date: '2026-05-15',
  scheduled_time: '17:00',
  expected_value_pence: 34000
}]->(l:LSOA)
```

**Why the resident's view instantly updates:**

The `RESIDENT_LOOKUP_QUERY` does:
```cypher
OPTIONAL MATCH (t:Trader)-[s:CONFIRMED_STOP]->(l)
WHERE s.date >= date()
```

Before the trader accepts, this `OPTIONAL MATCH` returns nothing — no stops shown.
After the trader accepts, the `CONFIRMED_STOP` relationship exists — the stop appears on the resident's map with the trader's name, schedule, and available products.

No pub/sub. No webhook. No polling. The resident simply queries the graph, and the relationship is either there or it isn't. The graph IS the source of truth.

---

## Full Pipeline (One Diagram)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
│Developer │────▶│  GitHub  │────▶│  GitHub  │────▶│     GHCR     │
│git push  │     │  (repo)  │     │  Actions │     │  (image reg) │
└──────────┘     └──────────┘     └──────────┘     └──────┬───────┘
                                       │                   │
                                       │ POST /execute     │ docker pull
                                       ▼                   ▼
                                  ┌──────────┐     ┌──────────────┐
                                  │ Komodo   │────▶│  kiwi/Unraid │
                                  │  Core    │     │  (Periphery) │
                                  └──────────┘     └──────┬───────┘
                                                          │
                                              docker compose up -d
                                                          │
                                  ┌───────────────────────┼────────────────┐
                                  │                       │                │
                                  ▼                       ▼                │
                           ┌────────────┐         ┌────────────┐          │
                           │savemystomach│         │savemystomach│          │
                           │   (web)    │◀──bolt──│   (neo4j)  │          │
                           │  :3000     │         │  :7687     │          │
                           └─────┬──────┘         └────────────┘          │
                                 │ mapped to :8910                        │
                                 └────────────────────────────────────────┘
                                          │
                            Tailscale (100.85.82.61:8910)
                                          │
                                          ▼
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  User    │────▶│Cloudflare│────▶│  Caddy (VPS) │
│(browser) │     │  (DNS)   │     │  TLS + proxy │
└──────────┘     └──────────┘     └──────────────┘
                 savemystomach.keanuc.net
```

---

## Timing (Approximate)

| Step | Duration |
|------|----------|
| GitHub Actions build + push | ~90s |
| Komodo API call + periphery pull | ~15s |
| Container restart + neo4j healthcheck | ~30s |
| Total: push to live | ~2.5 min |
