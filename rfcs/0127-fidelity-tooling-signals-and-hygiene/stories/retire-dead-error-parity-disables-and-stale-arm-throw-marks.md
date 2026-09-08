---
title: "Retire three dead rails-error-parity disables and tighten three stale arm-throw marks"
status: draft
updated: 2026-09-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two pre-existing gate/lint stalenesses observed on `main` while running the
pre-PR checklist for #7606. Neither was caused by that PR — it touches none of
the named files — and both were left alone there rather than silently
reseeded.

**1. `hash-with-indifferent-access.ts` holds three dead
`rails-error-parity` disables.** `pnpm lint` reports:

````text
packages/activesupport/src/hash-with-indifferent-access.ts
  278:7   warning  Unused eslint-disable directive (no problems were reported from 'blazetrails/rails-error-parity')
  397:11  warning  Unused eslint-disable directive
  407:7   warning  Unused eslint-disable directive
```text

All three sit on `throw new TypeError(...)` raises whose Rails counterparts
(`activesupport/lib/active_support/hash_with_indifferent_access.rb`) the rule
no longer objects to. A stale disable is exactly the "documented deviation is
debt" shape CLAUDE.md warns about: it reads as a ratified divergence where
there is no longer a divergence at all. `--fix` removes them, but each should
be checked against the Rails line first in case the rule stopped seeing a real
miss.

Related but distinct: `rails-error-parity-exclude-holds-rows-for-files-with-no-throws`
(RFC 0111) is about the exclude JSON; this is about inline directives.

**2. `arm-throw-mark.json` carries three marks above the measurement.**
`pnpm parity:api:arms:throws` on a clean `main`:

```text
arm-throw gate: activerecord total mark 35 is above the current 32
arm-throw gate: activerecord attribute-methods.ts mark 1 is above the current 0
arm-throw gate: activerecord connection-adapters/postgresql-adapter.ts mark 4 is above the current 2
```text

The gate still exits OK (a mark above the measurement is only-shrink slack, not
a violation), so nothing is red — but the slack is unearned headroom: three
missing-`throw` arms could regress back in without the gate noticing. The marks
last moved in #7554 (the gate's introduction) and #7601.

## Converged shape

Delete the three dead directives, and run
`pnpm parity:api:arms:throws:tighten` for the three stale shards ONLY — the
tighten verb writes marks DOWN and never up, and must not be confused with a
reseed.

## Acceptance criteria

- [ ] `pnpm lint` reports zero warnings.
- [ ] Each removed directive is justified by its Rails line in the PR body —
      the rule going quiet is not by itself proof the raise converged.
- [ ] `pnpm parity:api:arms:throws` reports no "mark is above the current"
      lines.
- [ ] No mark is written upward and no reseed is run.
````
