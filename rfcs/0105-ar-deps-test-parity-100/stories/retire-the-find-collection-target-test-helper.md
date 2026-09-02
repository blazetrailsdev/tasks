---
title: "Retire the findCollectionTarget test helper — Rails tests read the association directly"
status: done
updated: 2026-09-02
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 10
pr: 7397
claim: "2026-09-02T18:28:48Z"
assignee: "retire-the-find-collection-target-test-helper"
blocked-by: null
closed-reason: null
---

# Retire the `findCollectionTarget` test helper

## Context

PR #7167 (`burn-down-inline-fallback-call-sites-in-has-many-associations-test`)
converged every call site onto a declared association and reduced
`packages/activerecord/src/test-helpers/find-collection-target.ts` to a single
delegating line:

```ts
export async function findCollectionTarget(record: Base, name: string): Promise<Base[]> {
  return (await association.call(record, name).loadTarget()) as Base[];
}
```

Rails' tests have no such helper. They read the collection through the
association itself — `author.posts`, or
`author.association(:posts).load_target` where the test is specifically about
the loader (`vendor/rails/activerecord/lib/active_record/associations/association.rb:189-195`,
`associations.rb:1302`). The helper now buys nothing but the `Base[]` cast, and
its presence is why ~130 call sites across 11 files spell a load in a way no
Rails test does.

Call sites (all `.test.ts`, all now two-argument):

- `associations/has-many-associations.test.ts` (~117)
- `associations/inverse-associations.test.ts`, `associations.test.ts`,
  `strict-loading.trails.test.ts`,
  `associations/association-scope-cache.trails.test.ts`,
  `associations/association-scope.trails.test.ts`,
  `associations/source-type-validation.trails.test.ts`,
  `associations/has-many-mid-flight-reassignment.trails.test.ts`, and the three
  `associations/disable-joins-*.trails.test.ts` files

## Converged shape

Delete the helper and its module. Each call site becomes what the Rails test it
mirrors spells:

- the dotted accessor (`await author.posts`) wherever the test is about the
  collection's contents — the repo's standing preference for association reads
  in tests; or
- `record.association(name).loadTarget()` where the test is specifically about
  the loader path (`find_target?` gating, scope caching, strict loading,
  disable_joins routing) and Rails likewise reaches for `association(...)`.

Note that many of the owners are bespoke inline model classes; declaring the TS
field needed for the dotted form overlaps
[[has-many-associations-bespoke-inline-models-hide-vacuous-tests]], which
converges those same classes onto canonical models. Sequencing the two — or
folding this into it for that one file — is a triage call.

## Acceptance criteria

- [ ] `packages/activerecord/src/test-helpers/find-collection-target.ts` is
      deleted and no file imports it.
- [ ] Every former call site reads the collection the way its Rails counterpart
      does; no test names change.
- [ ] The touched suites stay green on all lanes.
