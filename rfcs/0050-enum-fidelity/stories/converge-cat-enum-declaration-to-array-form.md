---
title: "Converge canonical Cat's enum declaration to Rails' array form"
status: ready
updated: 2026-07-14
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The canonical `Cat` model declares its enum with the **hash** form where Rails
uses the **array** form:

- trails: `packages/activerecord/src/test-helpers/models/cat.ts:16` —
  `this.enum("gender", { female: 0, male: 1 })`
- Rails: `vendor/rails/activerecord/test/models/cat.rb:6` —
  `enum :gender, [:female, :male]`

Behaviorally identical (the array form assigns indices 0..n, which is exactly
what the hash spells out), so nothing is broken — this is a port-fidelity
divergence in a canonical test model, tracked per "converge, never ratify"
rather than left as prose.

Surfaced during review of PR #4864
(register-lions-fixture-set-for-abstract-cat-enum), where the reviewer flagged
it while correcting an earlier claim that `cat.ts` mirrors `cat.rb` exactly. It
was outside that PR's diff, so it was not fixed there.

Worth checking whether the array form is exercised by any canonical model at
all: if `Cat` is the only Rails model using it, converging here also gives the
array-form code path its only canonical-model coverage.

## Acceptance criteria

- `cat.ts:16` uses the array form, mirroring `cat.rb:6`.
- `Lion`'s label union typing (`"female" | "male" | null`, added in PR #4864)
  still holds, and `enum.trails.test.ts` / `scoping/default-scoping.test.ts`
  stay green.
- If other canonical models diverge from their Rails counterpart's enum
  declaration form, converge them in the same pass; if the array form turns out
  to be unsupported by the trails `enum()` surface, that is the real finding —
  file it rather than ratifying the hash form here.
