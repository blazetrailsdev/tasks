---
title: "find-without-id-message-convergence"
status: draft
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while reviewing PR #4001 (find([]) → []). Zero-argument `find()` on a
simple PK raises `RecordNotFound` with the message
`"Couldn't find <Model> with an empty list of ids"`, but Rails
`FinderMethods#find_with_ids` (activerecord/lib/active_record/relation/finder_methods.rb,
the `when 0` branch) raises `"Couldn't find <Model> without an ID"`.

trails sites that produce the divergent message:

- `packages/activerecord/src/relation/finder-methods.ts:86` (`normalizeFindArgs`,
  `args.length === 0` guard) and the post-flatten `ids.length === 0` guard.
- `packages/activerecord/src/core.ts:738` (`find`, `ids.length === 0` guard).

Note Rails reaches the "without an ID" path only after `ids.first` short-circuit

- `compact.uniq` collapse to size 0 (e.g. `find()`, `find(nil)`), distinct from
  the empty-array case `find([])` which returns `[]` (already converged in #4001).

## Acceptance criteria

- [ ] Zero-arg `find()` / all-nil `find(nil)` raise with Rails' exact message
      `"Couldn't find <Model> without an ID"`.
- [ ] `RecordNotFound` payload (model, primaryKey, id) matches Rails
      `RecordNotFound.new(error_message, model_name, primary_key)` (no id arg).
- [ ] Update tests asserting the old "empty list of ids" message; keep test
      names matching Rails verbatim.
- [ ] No regression to the `find([])` → `[]` behavior.
