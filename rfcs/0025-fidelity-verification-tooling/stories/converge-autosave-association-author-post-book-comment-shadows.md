---
title: "converge-autosave-association-author-post-book-comment-shadows"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up pass 3 of `converge-autosave-association-bespoke-registermodel-canonical-shadows`.

`packages/activerecord/src/autosave-association.test.ts` registers bespoke
classes under canonical **Author / Post / Book / Comment / Category** names,
which the `registerModel` canonical-shadow guard
(`packages/activerecord/src/associations.ts` — `guardCanonicalNameShadow`)
rejects once the file imports `./test-helpers/canonical-model-index.js`.

Sites (line numbers as of the pass-1 commit): 1916/1917, 2839/2840, 2921/2922,
2962/2963, 3181/3182, 3222/3223, 3776/3777, 3848/3849, 3949/3950 (Comment+Category),
and 4019/4020 — note the `AuthorM`/`BookM` dynamic-import aliasing there.

Canonical models: `test-helpers/models/{author,post,comment,categor*}.ts`.
Rails source: `vendor/rails/activerecord/test/cases/autosave_association_test.rb`
plus `test/models/{author,post,comment,category}.rb`.

## Acceptance criteria

- Each listed site uses the canonical model (read the corresponding Rails test
  first; do NOT rename tests), or a distinct non-canonical name where no
  canonical model fits.
- Existing tests stay green (`pnpm vitest run packages/activerecord/src/autosave-association.test.ts`).
- 500 LOC ceiling; single PR from `main`, no stacking.
