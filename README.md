# Neobankify

White-label, multi-tenant AI-powered neobanking platform focused on rewards optimization, with future expansion into investing, trading, and lending.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system architecture document.

## Quick Start (Local Development)

```bash
# Start infrastructure (Postgres, Redis, Kafka)
docker-compose up -d

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start all services in development mode
npm run dev
```

## Project Structure

```
├── services/           # TypeScript microservices
│   ├── api-gateway/    # API Gateway (port 3000)
│   ├── auth-service/   # Authentication + KYC (port 3001)
│   ├── tenant-service/ # Multi-tenant config (port 3002)
│   ├── account-aggregation/ # Plaid integration (port 3003)
│   ├── transaction-ingestion/ # Transaction pipeline (port 3004)
│   ├── rewards-catalog/ # Rewards tracking (port 3005)
│   ├── card-management/ # Card portfolio (port 3006)
│   ├── idle-cash-service/ # Yield optimization (port 3007)
│   ├── audit-service/  # Immutable audit log (port 3008)
│   ├── compliance-service/ # Compliance rules (port 3009)
│   └── notification-service/ # Notifications (port 3010)
├── ai-agents/          # Python AI agents
│   ├── orchestrator/   # Central coordinator
│   ├── rewards-optimization/ # Card routing optimizer
│   ├── idle-cash-agent/ # Cash sweep optimizer
│   ├── risk-guardrail/ # Safety guardrails (deterministic)
│   └── behavioral-learning/ # Pattern detection
├── packages/           # Shared packages
│   ├── shared-types/   # TypeScript type definitions
│   └── event-schemas/  # Kafka event schemas
├── database/           # PostgreSQL migrations
├── infrastructure/     # Terraform IaC
└── docker/             # Dockerfiles
```

## License

Proprietary - All rights reserved.
