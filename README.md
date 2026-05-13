# SaveMyStomach

Fresh food delivered to forgotten neighbourhoods.

A platform connecting UK food desert residents with mobile market traders. We pre-aggregate resident demand so traders can profitably add food desert stops along their existing weekly market circuits.

## How it works

1. **Residents** enter their postcode, see upcoming trader stops on a map, and pre-order fresh produce
2. **Traders** see aggregated demand from food desert areas, ranked by revenue potential
3. When a trader **accepts a stop**, residents immediately see it — the graph database IS the source of truth

## Tech stack

- **Next.js 16** — App Router, TypeScript, TailwindCSS, shadcn/ui
- **Neo4j 5** — Graph database modelling traders, markets, residents, products, and their relationships
- **OpenAI API** — Trader assistant chat (via configurable gateway)
- **React-Leaflet** — OpenStreetMap-based mapping
- **Docker** — Multi-container deployment (web + Neo4j)

## Running locally

```bash
npm install
cp .env.example .env.local
# Fill in NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, KIMCHI_BASE_URL, KIMCHI_API_KEY
npm run dev
```

To run with Docker (includes Neo4j):
```bash
docker compose up -d
# Seed the database:
cat lib/seed-data.cypher | docker exec -i savemystomach-neo4j cypher-shell -u neo4j -p <password>
```

## Deployment

Pushes to `master` trigger GitHub Actions which builds and pushes a Docker image to GHCR. Komodo auto-pulls the new image on the homelab server.

Live at: **savemystomach.keanuc.net**

## Project structure

```
app/
├── page.tsx                  # Landing page
├── resident/page.tsx         # Resident flow (postcode → map → order → confirm)
├── trader/page.tsx           # Trader dashboard (infill stops, chat)
└── api/
    ├── resident/lookup/      # Postcode → LSOA + upcoming stops (Neo4j)
    ├── resident/order/       # Place order (writes to Neo4j)
    ├── trader/profile/       # Trader info + circuit (Neo4j)
    ├── trader/infill/        # Demand-ranked infill stops (Neo4j)
    ├── trader/accept-stop/   # Confirm a stop (Neo4j write)
    └── trader/chat/          # LLM assistant

lib/
├── neo4j.ts                  # Driver + query helper (auto-converts Neo4j Integers)
├── cypher.ts                 # All Cypher queries
├── kimchi.ts                 # LLM gateway (OpenAI SDK)
└── seed-data.cypher          # Full graph seed script
```

## Graph model

```
(:Trader)-[:ATTENDS]->(:Market)
(:Trader)-[:SUPPLIES]->(:Product)
(:Trader)-[:CONFIRMED_STOP]->(:LSOA)
(:Resident)-[:LIVES_IN]->(:LSOA)
(:Resident)-[:ORDERED]->(:Product)
```

## Demo postcodes

- `E2 6BG` — Tower Hamlets (primary demo LSOA, 3 residents, ~£340 demand)
- Any other postcode falls back to the Tower Hamlets demo data

## Team

Built at TESSL Night hackathon, May 2026.
