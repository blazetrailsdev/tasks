---
title: "CollectionProxy#find RecordNotFound messages converge to Rails (pluralize + found/expected suffix)"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging `Core#find` not-found messages (PR #4114,
`core-find-record-not-found-message-format-fidelity`). The in-memory
association find path raises `RecordNotFound` via the bespoke
`raiseNotFoundSingle` / `raiseNotFoundAll` helpers
(`packages/activerecord/src/relation/finder-methods.ts`), whose messages
diverge from Rails' single `raise_record_not_found_exception!`
(`finder_methods.rb:417-434`):

- `raiseNotFoundAll` →
  `Couldn't find all Post with 'id': (1, 2, 3) [WHERE …]`
  Rails →
  `Couldn't find all Posts with 'id': (1, 2, 3) [WHERE …] (found 2 results, but was looking for 3).`
  Two gaps: (a) Rails pluralizes the model name (`name.pluralize` → "Posts");
  (b) Rails appends `(found #{result_size} results, but was looking for #{expected_size}).`.

Call sites still on the simplified helpers:

- `packages/activerecord/src/associations/collection-association.ts:122`
  (`raiseNotFoundAll`)
- `packages/activerecord/src/associations/collection-proxy.ts:2965`
  (`raiseNotFoundAll`) and `:2976` (`raiseNotFoundSingle`)

Rails routes `CollectionProxy#find` through `find_with_ids` →
`find_one`/`find_some` → `raise_record_not_found_exception!`, the same faithful
builder already implemented in trails as `raiseRecordNotFoundExceptionBang`
(used by `findOne`/`findSome`/the bang finders).

This is the association sibling of
`performfind-converge-raise-record-not-found-builder` (which scopes only the
relation `performFind` path) and `core-find-record-not-found-message-format-fidelity`
(which converged `Core#find` via an inline `raiseCouldntFindAll`). Doing all
three converges every find path onto Rails' single message form.

## Acceptance criteria

- `CollectionProxy#find` miss messages (single-id and aggregate) pluralize the
  model name and include `(found N results, but was looking for M).`, matching
  Rails `raise_record_not_found_exception!` byte-for-byte — for both the
  `raiseNotFoundAll` and `raiseNotFoundSingle` association call sites.
- `RecordNotFound` payload (model, primaryKey, id) unchanged.
- Tests assert the full association miss messages (mirror the relevant Rails
  `associations`/`finder` test cases).
