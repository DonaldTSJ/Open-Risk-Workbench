# Threat Model

## Assets

- provenance and evidence status;
- scenario and formula versions;
- graph integrity;
- event ordering and state invariants;
- review results and traces.

## Threats and controls

| Threat | Control |
|---|---|
| Unverified prose becomes executable | Context Pack compiler requires acceptable evidence for each formula node |
| Dependency omitted or renamed | Local dependency closure and missing-node failure |
| Circular formulas | Cycle detection before execution |
| Before/after model drift | Graph hash compared across every replay snapshot |
| Invalid order history | Ordered event projector and fail-closed transition checks |
| Quantity created or lost | Quantity-conservation invariant |
| Secret or corporate material committed | Local sensitive-data scan plus contributor provenance policy |
| Demo mistaken for production policy | Synthetic and production-authority labels in code, UI, and docs |

## Out of scope

The project does not authenticate users, connect to brokers, place orders, ingest private documents, or provide production security controls. Any such integration requires a separate threat model and review.
