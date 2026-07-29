---
title: "convert-query-transformers-accessor"
status: done
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5565
claim: "2026-07-29T02:45:44Z"
assignee: "convert-query-transformers-accessor"
blocked-by: null
closed-reason: null
---

## Context

Last shape-2 conversion in RFC 0081. `setQueryTransformers` is the one
module-level writer re-spelling that does NOT live in
`packages/activerecord/src/ar-config.ts` — it sits in
`packages/activerecord/src/query-transformers.ts` (or wherever the sweep
recorded it; confirm with `grep -rn setQueryTransformers packages/`).

Read the "Decision — shape 2" section of the RFC README first. The open
question this story has to answer, which the `ar-config.ts` batches did not:
whether `queryTransformers` joins the same `ActiveRecord` object exported from
`ar-config.ts` (Rails spells it `ActiveRecord.query_transformers=`, which argues
yes) or gets its own object in its own file. Prefer joining the existing
`ActiveRecord` object if it does not create an import cycle between
`ar-config.ts` and `query-transformers.ts`; if it does, note the cycle in the PR
and keep the accessor local.

## Acceptance criteria

- `queryTransformers` reads and writes as an accessor under its Rails name;
  `setQueryTransformers` deleted.
- Call sites updated to assignment.
- A one-paragraph note in the RFC README recording which host was chosen and
  why.
- `pnpm api:compare` credits `queryTransformers` under its Rails name; overall
  matched count does not drop.
