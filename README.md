# Open Risk Workbench

**Open Risk Workbench turns documentary knowledge into a versioned, executable, and reviewable synthetic risk scenario.** It demonstrates how an AI-assisted knowledge layer can support deterministic financial logic without letting unverified prose silently become a trading rule.

> Educational synthetic model only. It is not production risk policy, investment advice, or a substitute for legal, compliance, clearing, or broker controls.

## Why this project exists

Most financial knowledge projects stop at retrieval. Most calculators start with hard-coded rules. That leaves a dangerous gap: reviewers cannot tell which evidence justified a calculation, and document updates can drift away from executable behavior.

This project closes that gap:

```text
Document evidence
      ↓
Typed claims and relationships
      ↓
Versioned Scenario Context Pack
      ↓
Event and state replay
      ↓
Deterministic formula DAG
      ↓
Constraints, checks, and audit review
```

The **Context Pack is the seam**. The knowledge module may describe many claims, but the simulation module executes only a locally closed dependency graph whose formula nodes all have acceptable evidence.

## What makes it enterprise-shaped

- Evidence states distinguish public, synthetic, disputed, unknown, and rejected material.
- Event/state logic, numeric formula DAGs, and constraint decisions remain separate.
- Every replay snapshot carries the same graph hash and version set.
- Missing evidence, missing inputs, graph cycles, invalid events, and non-finite results fail closed.
- Output includes node-level traces and invariant checks, not just a number.
- Synthetic examples are explicitly marked and cannot be promoted to production authority.

## Quick start

Requirements: Node.js 20 or later.

```bash
npm test
npm run check:sensitive
npm start
```

Then open <http://localhost:4173>.

No runtime dependencies, build step, API key, account, or external data source is required.

## Public interface

```js
import { buildKnowledgeBase, runRiskReview } from './src/index.js';

const knowledgeBase = buildKnowledgeBase(documents);
const result = runRiskReview({ knowledgeBase, scenario, events });
```

`runRiskReview` is intentionally a deep module: one small interface compiles evidence, closes and hashes the dependency graph, replays events, executes every snapshot, evaluates checks, and returns an auditable report.

## Repository map

```text
examples/          Synthetic documents, scenario, and events
schemas/           Machine-readable contracts
src/knowledge.js   Evidence graph and Context Pack compiler
src/engine.js      Event projector and synthetic formula definitions
src/dag.js         Dependency closure, cycle detection, hash, execution trace
src/review.js      End-to-end review module
tests/             Contract, failure, replay, and invariant tests
docs/              Architecture, provenance, and threat model
scripts/           Local server and sensitive-data scan
```

## Current scope

Version 0.1 contains one deliberately small synthetic equity order lifecycle:

```text
ORDER_ACCEPTED → PARTIAL_FILL → CANCEL_REMAINDER
```

The formulas are an abstract teaching model created for this repository. They do not reproduce a broker, exchange, clearing house, or regulator's production policy. The project focuses on the governance and verification architecture around risk logic.

## 中文简介

Open Risk Workbench 把“文档知识服务”和“金融试算审核”连接成一条可审计链路：文档先编制为带来源状态的知识声明，再编译为版本锁定的场景上下文包；试算引擎只执行该上下文包，并输出事件回放、依赖图哈希、节点计算轨迹、不变量检查和最终审核结论。

当前示例全部为合成数据和抽象模型，不包含任何企业内部资料、真实客户数据或生产规则。

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [GOVERNANCE.md](GOVERNANCE.md). Architecture details are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

[MIT](LICENSE)
