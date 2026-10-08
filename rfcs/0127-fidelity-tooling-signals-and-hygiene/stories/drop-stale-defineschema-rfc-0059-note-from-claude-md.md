---
title: "Drop the stale defineSchema / RFC 0059 note from CLAUDE.md"
status: draft
updated: 2026-10-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The root `CLAUDE.md` "Canonical tables only — no bespoke tables" bullet ends
with "(`defineSchema` is the retired trails invention being removed by RFC
0059; don't reach for it in new tests.)". RFC 0059 is closed and
`packages/activerecord/src/test-helpers/define-schema.ts` no longer exists;
the only `defineSchema` left in the tree is the name of the schema module the
dumper EMITS (`packages/activerecord/src/schema-dumper.ts:315,318`, the
`export default async function defineSchema(ctx)` line of a dumped
`schema.ts`), which is a different thing. The parenthetical now tells a new
agent to avoid a helper that does not exist and names a closed RFC.

## Acceptance criteria

- The parenthetical is deleted from the "Canonical tables only" bullet (or
  rewritten to say the test-helper is gone and that `defineSchema` in a dumped
  `schema.ts` is the dumper's output, not a test helper).
- No other `CLAUDE.md` sentence names RFC 0059 as in progress.
