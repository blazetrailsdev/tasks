---
title: "Converge performFind not-found onto raise_record_not_found_exception! (pluralize + found/expected suffix)"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`performFind` (`packages/activerecord/src/relation/finder-methods.ts`) raises via
the bespoke `raiseNotFoundSingle` / `raiseNotFoundAll` helpers, whose messages
diverge from Rails' single `raise_record_not_found_exception!`
(`finder_methods.rb:417-434`):

- `raiseNotFoundAll` produces
  `Couldn't find all Post with 'id': (1, 2, 3) [WHERE …]`
  but Rails produces
  `Couldn't find all Posts with 'id': (1, 2, 3) [WHERE …] (found 2 results, but was looking for 3).`
  Two gaps: (a) Rails pluralizes the model name (`name.pluralize` → "Posts"),
  trails uses the bare `${modelName}`; (b) Rails appends
  `(found #{result_size} results, but was looking for #{expected_size}).`,
  trails omits it.

The faithful path already exists — `raiseRecordNotFoundExceptionBang` (used by
`findOne`/`findSome`/the bang finders) composes the full Rails message including
pluralization + the found/expected suffix. PR #4108 added the `[WHERE …]` clause
to both paths but did not converge `performFind` onto the faithful builder.

## Acceptance criteria

- `performFind`'s not-found paths route through `raiseRecordNotFoundExceptionBang`
  (or otherwise emit the identical message), so the multi-id message pluralizes
  the model name and includes `(found N results, but was looking for M).`,
  matching Rails byte-for-byte.
- Tests asserting the full multi-id message (mirror the relevant Rails
  `finder_test.rb` cases).
