---
title: "Relation#only should slice values without unscope_values merge-replay"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - relations-test-canonical
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#only` (`packages/activerecord/src/relation.ts:1581`) is implemented as
`this.unscope(...complement)` — it computes the complement of the requested keys
against `VALID_UNSCOPING_VALUES` and delegates to `unscope`. Rails
`SpawnMethods#only(*onlies)` is `relation_with values.slice(*onlies)`
(`spawn_methods.rb`), which keeps only the named value keys and records **no**
`unscope_values` directive.

Delegating to `unscope` records `_unscopeValues`, which `Merger#mergeUnscope`
(`packages/activerecord/src/relation/merger.ts:41`) replays into the receiving
relation on merge — so `other.merge(rel.only("where"))` erases parts of `other`,
unlike Rails. This is the exact divergence fixed for `except` in PR #4052
(see `resetValueForScope` + the value-key-remover `except`); `only` was left
unchanged to keep that PR scoped.

Additionally, `only` is limited to `VALID_UNSCOPING_VALUES` and so does not keep
the broader `Relation::VALUE_METHODS` keys (`distinct`, `strictLoading`,
`references`/`_manualReferences`, `extending`, `unscope`, `reordering`,
`skipQueryCache`) that `except` now handles via the `ExceptKey` set.

## Acceptance criteria

- `Relation#only(*onlies)` keeps only the named value keys and records no
  `unscope_values` (no merge replay), mirroring `values.slice(*onlies)`.
- Reuse the `resetValueForScope` helper / `ExceptKey` set so `only` covers the
  same full `VALUE_METHODS` key surface as `except` (reset the complement).
- Add a merge-replay regression test (mirroring the `except` test in
  `relations.test.ts`) proving `other.merge(rel.only(...))` does not erase
  `other`'s parts.
- No api:compare regression; `spawn_methods.rb` stays 100%.
