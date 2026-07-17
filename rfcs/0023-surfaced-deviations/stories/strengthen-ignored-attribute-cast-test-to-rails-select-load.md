---
title: "Strengthen 'ignored attribute cast type preferred' test to Rails' select(*) load + assertion"
status: draft
updated: 2026-07-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4909 (converge ignored-column attribute-set semantics).

The Rails test `base_test.rb` "when ignored attribute is loaded, cast type
should be preferred over DB type" actually LOADS a record and asserts the cast
value:

```ruby
loaded_developer = AttributedDeveloper.where(id: developer.id).select("*").first
assert_equal "Developer: name", loaded_developer.name
```

The trails port at `packages/activerecord/src/base.test.ts:1691` is a weakened
sync stub — it only checks `columnNames()` does not include the ignored column
and `hasAttributeDefinition()` is true. It never loads a row or reads the cast
accessor, so it does not verify what the Rails test verifies.

PR #4909 made the real behavior work (a declared-then-ignored column projected
by `SELECT *` casts through its type and responds to the accessor) and added a
`.trails.test.ts` guard for it. But the Rails-matched test itself remains a
stub. NEVER rename the test — strengthen its body to mirror Rails' actual
`select("*")` load + `loaded.name` assertion using the canonical
`AttributedDeveloper` model (`test-helpers/models/developer.ts`).

## Acceptance criteria

- `base.test.ts:1691` loads via `AttributedDeveloper.where({id}).select("*").first()`
  and asserts `loaded.name === "Developer: name"`, matching Rails' body.
- Test name unchanged.
- The redundant `.trails.test.ts` guard for the same behavior can be trimmed if
  it now duplicates the strengthened Rails-matched test.
