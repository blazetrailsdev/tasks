---
title: "ownerRecordsNothing hides 68 measured pairs from the call gate"
status: in-progress
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: 7156
claim: "2026-08-28T12:29:26Z"
assignee: "narrow-owner-records-nothing-call-gate-blind-spot"
blocked-by: null
closed-reason: null
---

## Context

`ownerRecordsNothing` (`scripts/api-compare/compare.ts:941`) suppresses call-set
and call-argument comparison for a pair whose resolved owner records no calls:

```ts
if (tsClass === undefined || (owners?.size ?? 0) <= 1) return false;
return byFileNameOwner.get(tsFile)?.get(tsName)?.get(tsClass) === undefined;
```

It exists so that, when a file declares `tsName` on several owners, a same-named
sibling's body cannot stand in for the one the pair actually resolved to. That
is correct as far as it goes — but its effect is to compare **nothing** for
those pairs, which is a false negative: a genuinely dropped call in such a body
cannot be flagged.

Story `ts-extractor-records-no-calls-for-getters` (PR #6656) asked whether the
arm still had a population once getters carried call sets, since it was
originally written as "the resolved owner records nothing, so compare nothing"
precisely because accessor call sets were invisible. **Measured after that
change**, by patching the arm to `return false` and diffing
`output/call-mismatches.json` against a normal run: the arm still suppresses
**68 pairs**, so it was kept. Sample of what it hides:

- `activemodel  dirty.ts  forget_attribute_assignments  map`
- `activerecord  relation.ts  exec_explain  join`
- `activerecord  autosave-association.ts  save_collection_association  add`
- `activesupport  callbacks.ts  run_callbacks  new`
- `activerecord  attributes.ts  _default_attributes  type_for_column`

Those are exactly the shape the gate exists to catch, and none of them is
currently visible to it or represented by a baseline row.

Rails counterpart: none — this is comparator tooling.

## Converged shape

Narrow the arm so it suppresses only what it was written for. The real question
is not "does this owner record anything" but "is this owner's own body the
counterpart". Options, in preference order:

1. Record a distinguishable "no body" marker for owners that genuinely have no
   body to compare (an interface member, an ambient declaration, an
   `abstract` method), and let owners that DO have a body be compared even when
   the current map lookup misses — the miss is then a bug in how the owner is
   keyed, not a reason to skip.
2. If the lookup miss is structural for a known member kind, enumerate those
   kinds explicitly instead of inferring "records nothing" from an absent map
   entry.

Expect the newly-compared bodies to surface pre-existing divergence: hand-add
those rows via `serializeBaseline` with real reasons, never `--write`.

## Acceptance criteria

- [ ] `ownerRecordsNothing`'s population is reduced to pairs that genuinely have
      no comparable body; the 68 pairs measured above are compared.
- [ ] A unit test in `scripts/api-compare/` pins the distinction (a
      multi-owner file where one owner has a body and one does not) and fails on
      baseline.
- [ ] Newly-surfaced rows are baselined by hand with reviewed reasons, or
      converged; no `--write` reseed of the exclude tree.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
