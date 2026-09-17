# Contributing

Contributions are welcome when they preserve the project's evidence and execution separation.

## Before opening a pull request

1. Use only public, license-compatible, original, or explicitly synthetic material.
2. Do not submit employer-confidential rules, customer/account data, production identifiers, or proprietary documents.
3. Mark synthetic values and assumptions in code, data, documentation, and UI.
4. Add evidence metadata for every new executable formula.
5. Add tests for success and failure behavior.
6. Run `npm run check`.

## Design expectations

- Keep event/state transitions separate from formulas.
- Keep formula DAGs separate from approval/rejection constraints.
- Treat missing or conflicting evidence as a blocking condition.
- Prefer a small public interface with behavior hidden inside a deep module.
- Do not claim production equivalence from local tests.

## Pull request checklist

- [ ] No confidential, personal, or third-party restricted material
- [ ] Provenance and license documented
- [ ] Synthetic/production authority labeled
- [ ] Tests cover invariants and failure modes
- [ ] Sensitive-data scan passes
- [ ] Documentation describes changed contracts
