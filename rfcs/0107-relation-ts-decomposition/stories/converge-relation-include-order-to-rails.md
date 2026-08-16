---
title: "Converge relation.ts's include() order to relation.rb:68"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6597
claim: "2026-08-16T13:45:03Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

`relation.rb:68` mixes the modules in one statement, in this order:

```ruby
include FinderMethods, Calculations, SpawnMethods, QueryMethods, Batches, Explain, Delegation
```

`relation.ts` (bottom of file, after `_registerRelationFamily`) issues them as
six separate `include()` calls in a different order:

```ts
include(Relation, QueryMethodBangs);
include(Relation, FinderMethods);
include(Relation, Calculations);
include(Relation, SpawnMethods);
include(Relation, DelegationMethods);
include(Relation, Batches);
```

`include()` implements Ruby's last-include-wins ancestry rule
(`activesupport/src/include.ts` — a collision on a key installed by an earlier
mixin is replaced; a collision with a class-body method is not). So the order is
load-bearing the moment any two modules define the same name, and today it is
only harmless because none of them collide.

Ruby's `include A, B, C` is NOT left-to-right: it inserts them so that `A` ends
up highest in the ancestry, i.e. it is equivalent to `include C; include B;
include A`. Any convergence has to reproduce that, not the surface order of the
argument list — verify against `Relation.ancestors` in `bin/rails runner`
before settling the TS order.

Surfaced in review of PR #6590 (retire-relation-private-thunk-block), which
appended `include(Relation, Batches)` at the end; the reviewer noted the
divergence predates that PR and the diff did not worsen it, so it was left
alone rather than converged out of scope.

## Acceptance criteria

- [ ] The `include()` calls in `relation.ts` produce the same method-resolution
      order as `relation.rb:68`, with the Ruby semantics of a multi-argument
      `include` reproduced (confirm against `Relation.ancestors` in MRI, not
      inferred from the argument order).
- [ ] A comment or test pins the ordering so a later `include()` append cannot
      silently reintroduce the drift.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; no baseline
      rows added.
