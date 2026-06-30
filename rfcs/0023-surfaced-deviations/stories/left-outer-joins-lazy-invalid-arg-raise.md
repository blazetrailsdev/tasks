---
title: "left_outer_joins raises lazily at build for non-Hash/Symbol/Array, not eager whitespace heuristic"
status: ready
updated: 2026-06-30
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

`Relation#leftJoins`/`#leftOuterJoins` (and the sibling `joins`) decide
"raw SQL fragment vs association name" with an **eager** whitespace heuristic:
`if (typeof spec === "string" && /\s/.test(spec)) throw argumentError("only
associations and hashes are supported as arguments to leftOuterJoins")`
(`packages/activerecord/src/relation.ts` `_leftOuterJoins`, surfaced in PR #4342).

Rails has no such heuristic. `left_outer_joins(*args)` stores args verbatim
(`left_outer_joins_values |= args`) and only raises **lazily** at SQL-build
time, in `build_join_buckets` (`query_methods.rb:1828-1834`), where a
left-outer arg that is not a Hash/Symbol/Array (or CTEJoin) hits
`raise ArgumentError, "only Hash, Symbol and Array are allowed"`. So the raise
point, trigger condition (any non-Hash/Symbol/Array, not "string with a
space"), and message differ from trails.

## Acceptance criteria

- Remove the eager `/\s/` whitespace heuristic from the left-join path; store
  args verbatim into `_leftOuterJoinsValues`.
- Raise lazily at join-build time for any left-outer arg that is not a
  Hash/Symbol(string)/Array, matching `build_join_buckets`.
- Match Rails' message ("only Hash, Symbol and Array are allowed").
- Keep the variadic/empty-blank-compaction behavior converged in PR #4342.

## Out of scope

- The `joins` raw-string path (raw SQL strings ARE valid for inner joins);
  only the left-outer invalid-arg raise is in scope.
