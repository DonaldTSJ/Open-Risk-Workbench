# Architecture

## The full logic

Open Risk Workbench contains two collaborating modules and one deliberate seam.

```text
┌──────────────────────── Knowledge module ────────────────────────┐
│ Documents → typed claims → evidence graph → local evidence set  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                     Scenario Context Pack
               evidence + versions + graph manifest
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│ Event projector → state snapshot → formula DAG → constraints    │
│                              → invariant checks → audit output   │
└──────────────────────── Simulation and review module ────────────┘
```

The Context Pack seam prevents documentary prose from directly controlling calculations. It is compiled only when every executable formula in the scenario's local dependency closure has acceptable evidence.

## 1. Knowledge module

`buildKnowledgeBase(documents)` normalizes documents and claims into a typed graph.

A claim contains:

- a stable identifier;
- a statement;
- an evidence status;
- the model terms it supports;
- its source document and license context.

`compileContextPack(...)` computes only the evidence required by the selected scenario graph. Unsupported or unacceptable formula evidence stops compilation.

## 2. Context Pack seam

The Pack freezes:

- scenario identifier and version;
- synthetic/production-authority flags;
- formula nodes and typed edges;
- topological execution order;
- graph hash and hash algorithm;
- evidence manifest;
- unresolved governance questions.

Callers do not need to understand document parsing, graph closure, or evidence filtering. The interface stays small while the module hides substantial governance behavior.

## 3. Simulation module

The event projector consumes an immutable baseline plus an ordered event list. Events update canonical state; they do not directly update formula outputs.

```text
ORDER_ACCEPTED
  → creates open order and remaining quantity

PARTIAL_FILL
  → reduces remaining quantity
  → reduces cash ledger
  → increases position quantity

CANCEL_REMAINDER
  → moves all remaining quantity to cancelled
```

Every transition checks quantity conservation and refuses invalid history. A fill cannot be undone by a later replay step.

## 4. Formula DAG

State is materialized into typed inputs. `compileGraph` recursively closes dependencies from the requested targets, rejects missing nodes and cycles, produces a topological order, and hashes the stable manifest.

`executeGraph` walks that order and returns every node value in a trace. The current demo uses an abstract synthetic resource model; it is not a market rulebook.

## 5. Review module

`runRiskReview({ knowledgeBase, scenario, events })` is the public deep-module interface. It:

1. blocks non-synthetic scenarios;
2. compiles the formula graph;
3. compiles evidence into a Context Pack;
4. replays events into state snapshots;
5. executes the same graph for each snapshot;
6. verifies graph stability and invariants;
7. evaluates a synthetic probe order;
8. returns the Pack, snapshots, traces, checks, and decision.

## Expansion path

Future modules can add public regulatory adapters, multiple currencies, additional product types, alternative constraint sets, or external document adapters. The external review interface should remain stable; variation belongs behind internal seams.
