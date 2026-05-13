# SaveMyStomach — Architecture & Project Summary

## Problem

1.2 million Britons live in **food deserts** — areas with no supermarkets, where the nearest fresh produce is 20+ minutes away by public transport. Mobile market traders *could* serve these areas, but driving to low-density neighbourhoods without guaranteed demand is unprofitable.

## Solution

SaveMyStomach **pre-aggregates resident demand** in food desert areas, then surfaces these as **profitable "infill stops"** along traders' existing weekly market circuits. The unit economics work because:
- Residents pre-order and pre-pay → guaranteed revenue
- Stops sit geographically *between* markets the trader already attends → minimal detour
- A graph database calculates which stops maximise revenue per km of deviation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App (App Router)                   │
├──────────────────────┬──────────────────────────────────────┤
│   /resident          │   /trader                             │
│   - Postcode lookup  │   - Infill stop suggestions           │
│   - Stop selection   │   - Accept/decline stops              │
│   - Order placement  │   - Stock photo recognition (LLM)     │
│   - Confirmation     │   - Chat assistant (LLM)              │
├──────────────────────┴──────────────────────────────────────┤
│                      API Routes                              │
│   /api/resident/lookup    /api/trader/profile                │
│   /api/resident/order     /api/trader/infill                 │
│                           /api/trader/accept-stop            │
│                           /api/trader/recognise-stock        │
│                           /api/trader/chat                   │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                               │
│   lib/neo4j.ts  — Driver singleton + query helper            │
│   lib/cypher.ts — All Cypher queries (parameterized)         │
│   lib/kimchi.ts — OpenAI SDK → Kimchi gateway (LLM)          │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
    ┌───────▼───────┐               ┌────────▼────────┐
    │  Neo4j AuraDB │               │  Kimchi Gateway  │
    │  (Graph DB)   │               │  (LLM Router)    │
    └───────────────┘               └─────────────────┘
```

## Graph Model (Neo4j)

```
(:Trader)-[:ATTENDS]->(:Market)
(:Trader)-[:SUPPLIES]->(:Product)
(:Trader)-[:CONFIRMED_STOP]->(:LSOA)
(:Resident)-[:LIVES_IN]->(:LSOA)
(:Resident)-[:ORDERED]->(:Product)
```

**The Infill Query** — finds food desert LSOAs that sit along a trader's existing market-to-market route (within 1.5x direct distance), aggregates pending order value, and returns stops ranked by demand.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | TailwindCSS + shadcn/ui |
| Maps | React-Leaflet + OpenStreetMap tiles |
| Database | Neo4j AuraDB Free (graph) |
| LLM | OpenAI SDK → Kimchi gateway (gpt-4o for vision, gpt-4o-mini for chat) |
| Deployment | Docker (GHCR) → Komodo on Unraid → Caddy reverse proxy |
| CI/CD | GitHub Actions (build → push to GHCR → webhook triggers Komodo redeploy) |
| Domain | savemystomach.keanuc.net |

## Branches

| Branch | Owner | Content |
|--------|-------|---------|
| `stream-a` | Frontend | Landing page, resident flow, Map component, stub APIs |
| `stream-b` | Backend | Neo4j driver, Cypher queries, seed data, trader API routes |
| `stream-c` | LLM | Trader UI, Kimchi integration, stock recognition, chat |
| `main` | Merged | All streams combined for deployment |

## Demo Flow (Critical Path)

1. **Resident** enters postcode `E2 6BG` (Tower Hamlets food desert)
2. Sees upcoming stop from "Cotswold Fruit & Veg" on map
3. Orders tomatoes, spinach, apples → confirmation "Van arrives Thursday 5pm"
4. **Trader** opens dashboard, sees Tower Hamlets as top infill stop (£340 demand, 3 residents)
5. Clicks "Accept stop" → stop is confirmed
6. Resident lookup now shows the confirmed stop

## Key Files

```
app/
├── page.tsx                    # Landing (resident/trader choice)
├── resident/page.tsx           # Full resident flow
├── trader/page.tsx             # Trader dashboard
└── api/
    ├── resident/
    │   ├── lookup/route.ts     # Postcode → LSOA + upcoming stops
    │   └── order/route.ts      # Place order
    └── trader/
        ├── profile/route.ts    # Trader info + circuit
        ├── infill/route.ts     # Suggested infill stops
        ├── accept-stop/route.ts # Confirm a stop
        ├── recognise-stock/route.ts # LLM vision
        └── chat/route.ts       # LLM assistant

lib/
├── neo4j.ts                    # DB connection
├── cypher.ts                   # All Cypher queries
├── kimchi.ts                   # LLM gateway
└── seed-data.cypher            # Graph seed script

components/
├── Map.tsx                     # Dynamic import wrapper (SSR-safe)
└── MapInner.tsx                # React-Leaflet implementation
```

## Environment Variables

```
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxxxx
KIMCHI_BASE_URL=https://api.kimchi.dev/v1
KIMCHI_API_KEY=xxxxx
```

## Deployment Architecture

```
GitHub (push to main)
    → GitHub Actions builds Docker image
    → Pushes to ghcr.io/keanucz/savemystomach:latest
    → Webhook notifies Komodo
    → Komodo pulls new image on Unraid (kiwi)
    → Container restarts with new image
    → Caddy (VPS) proxies savemystomach.keanuc.net → kiwi:PORT
```

## Sponsor Integrations

- **Neo4j** — The entire route optimisation is a single graph query. Demonstrates graph-native thinking (relationships as first-class citizens, not JOINs).
- **Kimchi** — Multi-provider LLM gateway for stock recognition (vision) and trader assistant (chat). Failover between providers = reliability for traders in the field.
