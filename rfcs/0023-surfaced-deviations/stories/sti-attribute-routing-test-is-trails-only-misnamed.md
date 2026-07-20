---
title: "sti-attribute-routing.test.ts is a trails-only invention test under a non-.trails name"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/sti-attribute-routing.test.ts` is a trails-only
invention test file — it asserts trails' STI attribute-routing mechanics, and
`pnpm rails:find` returns no mapping for its test names (verified while updating
it in #4985). Repo convention is that TS-only extras live in `*.trails.test.ts`
so `test:compare` does not try to match them against Rails tests and so the
provenance is obvious to the next reader.

It currently sits under a plain `*.test.ts` name, which makes its names look like
they should correspond to Rails tests. This mattered concretely in #4985: one of
its assertions encoded a trails deviation, and the "NEVER rename or reword test
names" rule had to be checked against `rails:find` before the test could be
corrected. A `.trails.` name would have made that determination immediate.

## Acceptance criteria

- [ ] Confirm no test name in the file maps to a Rails test (`pnpm rails:find`).
- [ ] Rename to `sti-attribute-routing.trails.test.ts`.
- [ ] Confirm `test:compare` totals are unchanged by the rename.
- [ ] Sweep for sibling trails-only test files under plain `*.test.ts` names and
      list them (do not rename them in the same PR — file separately if numerous).
