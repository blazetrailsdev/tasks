---
title: "Ratchet the call-argument naming residue per package"
status: closed
updated: 2026-09-16
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by the RFC 0153 amendment (tasks#134): counts file replaced by @missingRailsName + NAMING_ENROLLED_PACKAGES; see naming-receipt-enrollment-gate"
---

## Context

RFC 0153 step 1. The call-argument gate's `naming` residue is counted but not
gated, so a PR that lands a new misnamed local raises the count silently. The
residue regressed from 214 `burndown` rows on 2026-08-27 to **249** on the RFC's
measurement (`3c6616b0f1`) — new ports add rows faster than waves drain them.
A burndown with no ratchet does not converge, which is why the mark lands before
any wave.

Model it on the settled mechanisms already in the repo — read
`scripts/api-compare/extra-surface-mark.ts` for the only-shrink / tighten-never-reseed
/ per-package-enrollment vocabulary, and `param-name-mark` for the test shape.

Population: `burndown` (249) + `module-mixin-receiver` (8) are `permanent: false`
in `NAMING_CLASSES` (`scripts/api-compare/naming-taxonomy.ts`) and must never be
baselined. The seven `permanent: true` classes (95 rows) are out of scope here.

## Acceptance criteria

- `scripts/api-compare/naming-residue-mark.ts` + `.json` + a unit test, keyed
  per package, seeded at the counts measured on its own rebased head.
- `pnpm parity:api:calls:args:naming` gates it; `…:naming:tighten` writes marks
  DOWN only and is a no-op on an unchanged tree. There is no reseed.
- Wired into the `rails-comparison` CI job.
- A deliberately misnamed local in a scratch branch reds the gate, naming the
  package, the Ruby file and the mark.
- CLAUDE.md and CONTRIBUTING.md document it beside the existing ratchets.
