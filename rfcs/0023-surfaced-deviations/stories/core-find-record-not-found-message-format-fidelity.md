---
title: "Core#find RecordNotFound messages converge to Rails format"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4114
claim: "2026-06-25T13:09:37Z"
assignee: "core-find-record-not-found-message-format-fidelity"
blocked-by: null
---

## Context

Surfaced while implementing `finder-single-element-array-dispatches-find-one`
(PR #4109). The model-level `Core#find` path (`packages/activerecord/src/core.ts`)
formats `RecordNotFound` messages in a non-Rails shape that also diverges from
the already-converged relation path (`performFind` →
`raiseNotFoundSingle`/`raiseNotFoundAll` in
`packages/activerecord/src/relation/finder-methods.ts`, converged by
`finder-raise-record-not-found-message-fidelity`, RFC 0047).

Divergent sites in `core.ts`:

- scalar miss `find(1)` → `"${name} with ${pk}=${id} not found"`
  (core.ts ~line 860), Rails: `"Couldn't find ${name} with '${pk}'=${id}"`.
- single-element-array miss `find([1])` → same scalar message (core.ts ~line
  846 after #4109), correct dispatch but divergent format.
- aggregate miss `find([1, 2])` → `"${name} with ${pk} in [${missing}] not found"`
  (core.ts ~line 845), Rails:
  `"Couldn't find all ${name} with '${pk}': (${ids}) (found N results, but was looking for M)."`.
- composite-PK misses (core.ts ~line 817, ~line 801) use bespoke
  `"... =[id] not found"` / `"couldn't find all with composite primary key"`.

Rails reference: `activerecord/lib/active_record/relation/finder_methods.rb`
`raise_record_not_found_exception!` (the single source of these messages).

Tests asserting the divergent strings live in `packages/activerecord/src/finder.test.ts`
(e.g. "find one message on primary key", "find by array of one id missing
raises single id message", "find by ids missing one") and must be re-pointed to
Rails' exact strings as part of convergence — verify against the Rails test
names first (`finder_test.rb` `test_find_one_message_on_primary_key`,
`test_find_some_message_with_custom_primary_key`).

## Acceptance criteria

- [x] `Core#find` raises the identical `RecordNotFound` message strings as
      Rails `raise_record_not_found_exception!` for: scalar miss,
      single-element-array miss, multi-id aggregate miss, and composite-PK miss.
- [x] The model path and relation path (`performFind`) produce the same message
      for the same miss (no inter-path divergence).
- [x] `RecordNotFound` payload (model, primaryKey, id) unchanged.
- [x] Tests converged to Rails-exact strings, named to match the corresponding
      Rails `finder_test.rb` tests.
