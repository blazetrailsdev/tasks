---
title: "Triage the 5 object-literal accessors the extractor fix made visible"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6103
claim: "2026-08-04T23:23:03Z"
assignee: "credit-mixin-methods-ported-in-their-own-file"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5391 (`module-level-config-accessor-shape`).

That PR taught `harvestObjectLiteralMethods`
(`scripts/api-compare/extract-ts-api.ts`) to read `get`/`set` accessors out of an
`export const X = { ... }` object literal — it previously ignored them, so any
such accessor was invisible to both `parity:api` and `parity:api:extra`.

Making them visible revealed five accessors that were already there and had never
been scored. They need the ordinary extra-surface triage (port it, rename it,
tag it `@noRailsEquivalent`, or allowlist it with a reason):

- `actionview` `helpers/output-safety-helper.ts` — `h`, `htmlEscapeOnce`
- `actionview` `template/handlers.ts` — `defaultExt`
- `trailties` `generators/base.ts` — `tableize`, `underscore`

Package deltas from that PR: actionview 33 novel/56 moved -> 34/58; trailties
61/86 -> 61/88. Nothing in CI gates on `parity:api:extra`, so this did not fail a
build — it is a real but unpoliced increase.

`h` and `htmlEscapeOnce` are likely genuine Rails methods living in a different
.rb (`ERB::Util`), i.e. "moved" not "novel", and may just need a mapping. Check
before treating any of these as drift.

## Acceptance criteria

- Each of the five classified against the Rails source with a `file:line`, and
  resolved the appropriate way — do NOT blanket-allowlist them.
- `pnpm parity:api:extra` shows the resulting drop with no stale allowlist entries.
- Confirm no OTHER object-literal accessors elsewhere are still miscounted now
  that the extractor sees them (re-run and diff against the counts above).
