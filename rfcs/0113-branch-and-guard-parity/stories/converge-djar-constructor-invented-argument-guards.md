---
title: "DisableJoinsAssociationRelation's constructor raises four ArgumentErrors Rails does not have"
status: done
updated: 2026-09-04
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 7488
claim: "2026-09-04T17:50:45Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7212 (`converge-djar-constructor-fourth-slot`), which removed the
constructor's fourth slot and, with it, the one guard that slot existed to gate
(`normalizedKey === "" && !chainWalker`). What that removal exposed is that the
guard was not alone: `DisableJoinsAssociationRelation`'s constructor carries a
whole layer of argument validation that Rails does not have anywhere.

Rails (`vendor/rails/activerecord/lib/active_record/disable_joins_association_relation.rb:7-11`):

```ruby
def initialize(klass, key, ids)
  @ids = ids.uniq
  @key = key
  super(klass)
end
```

Three lines, no checks. `ids.uniq` and nothing else.

trails (`packages/activerecord/src/disable-joins-association-relation.ts`, the
constructor body) raises `argumentError` in four places Rails does not:

- `ids` not an array;
- a composite `key` of length 0;
- a single-column `ids[i]` that is a multi-element array;
- a composite `ids[i]` that is not an array, or whose arity does not match the key.

Alongside those it carries a key-collapse step (a one-element `key` array becomes
the scalar string, with its `ids` tuples flattened) that Rails also has no
counterpart for. The composite-key handling itself is real work the port needs —
Rails' `record[key]` grouping is scalar-only — but the _validation_ is invented
surface at a site Rails leaves bare, and it is what makes the constructor read
nothing like `disable_joins_association_relation.rb`.

## Converged shape

The constructor body is Rails' three lines: store `key`, store the uniqued
`ids`, `super(klass)`. The composite-key state the port genuinely needs
(`_storedKeyStrings`, the tuple serialization) is derived without raising, and
the four `argumentError` sites are deleted rather than relocated — a caller
passing a mis-shaped tuple gets whatever the downstream Arel/`load` path already
does with it, which is what Rails gives.

If any single guard turns out to be load-bearing for a real caller rather than
for a test, that one survives with a `@noRailsEquivalent` receipt naming the
caller; the other three go. Check
`packages/activerecord/src/associations/disable-joins-composite-key.trails.test.ts`
first — it is the only place that exercises them, and its assertions move or go
with the guards.

Note the empty-key guard is already gone (PR #7212) and needs no further work;
this story is about the four that remain.

## Acceptance criteria

- The constructor body mirrors `disable_joins_association_relation.rb:7-11`: no
  `argumentError` raised from it, or exactly one surviving guard carrying a
  `@noRailsEquivalent PERMANENT|CONVERGEABLE` receipt with the caller it
  protects named at the call site.
- `disable-joins-composite-key.trails.test.ts` assertions for the deleted guards
  are removed, not renamed; no Rails-named test is touched.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` and `parity:api:extra:gate` show no new row.
- The AR suite is green on all three lanes, including the `disable-joins-*` and
  `has-*-through-disable-joins-associations` files.
