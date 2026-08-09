---
title: "Dedupe the two synchronous listJsonFiles copies in scripts/parity diff modules"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: deduping two listJsonFiles copies under scripts/parity is internal tooling hygiene with no Rails counterpart; if it is worth doing it belongs to RFC 0092 (compare-tooling consolidation), not to a fidelity backlog."
---

## Context

`scripts/parity/schema/diff.ts:45` and `scripts/parity/query/diff.ts:133` each
carry a private, **synchronous** `listJsonFiles(dir): string[]` built on
`readdirSync`. They are byte-identical to each other and duplicate the walk
logic of the async `listJsonFiles` in `scripts/api-compare/baseline-json.ts:36`,
which PR #5942 made the single async implementation under `scripts/`.

These two were deliberately left out of #5942: the signature differs (sync,
returns `string[]`) and both call sites sit inside synchronous diff functions
(`scripts/parity/schema/diff.ts:63-64`, `scripts/parity/query/diff.ts:153-154`),
so deduping them means either making those diff paths async or keeping a second
sync helper. That is a design call, not a mechanical dedup.

## Acceptance criteria

- One recursive `*.json` walk implementation is shared by both parity diff
  modules (either both awaiting the existing async helper, or one shared sync
  helper — decide and record the choice in a one-line comment).
- Repo hard rule respected: async fs preferred; if a sync helper is kept, the
  reason is stated at the definition.
- `pnpm vitest run scripts/parity` stays green and parity diff output is
  unchanged.
