# Business Tycoon Roadmap (R0-R5)

## Product Direction
- Core focus: `product + users + infrastructure + competition`.
- Secondary systems (ISO, office decor, generic events) must support the core loop.

## R0: Simulation Foundation
### Goals
- Stable simulation base before adding deep product systems.

### Scope
- Versioned persistence (`saveVersion`) with migration support.
- Debug sandbox overlay:
  - pause/resume,
  - week fast-forward,
  - force event trigger.
- Formula inspector and metric breakdown visibility.
- Event log with reason strings for key metric changes.
- Balance constants moved into centralized config.

### Done Criteria
- Save survives page reload and restores full playing state.
- Migrator handles save version mismatch without crash.
- Dev tools can quickly inspect and manipulate simulation.
- Economy numbers are explainable in UI.

## R1: Product Core (Narrow MVP)
### Scope
- `LiveProduct` as center of gameplay.
- Product dashboard with MVP metrics:
  - traffic,
  - signups,
  - active users,
  - paying users,
  - satisfaction,
  - conversion,
  - churn.
- Feature slots and basic feature classes.
- Explainability:
  - top positive factors,
  - top negative factors,
  - bottleneck warnings.

## R2: Production Chain (MVP)
### Scope
- Team output resources:
  - code,
  - design,
  - ops,
  - support.
- Production queues and inventory.
- Feature upgrade requirements based on produced resources.

## R3: Infrastructure + Support Base
### Scope
- Hosting gameplay (`cloud` vs `own capacity`).
- Capacity model (`web/db/cache` minimum).
- Service degradation loop:
  - users/traffic -> load -> latency/outage -> satisfaction/churn.
- Basic support queue and complaint handling.

## R4: Competition + Guided Progression
### Scope
- Niche competitors, market share, ranking ladder.
- Competitive pressure events.
- Guided milestones/tutorial layer.
- M&A lite actions:
  - buy user base,
  - acquire technology,
  - acqui-hire,
  - brand boost.

## R5: Corporate + Late Game
### Scope
- Investor system and cap table:
  - seed/series rounds,
  - dilution,
  - buyback,
  - valuation.
- HR depth:
  - recruiting funnel,
  - expectations,
  - retention and counter-offers.
- Expanded support/live ops and crisis response.
- Multi-product and deep late-game bottlenecks.
