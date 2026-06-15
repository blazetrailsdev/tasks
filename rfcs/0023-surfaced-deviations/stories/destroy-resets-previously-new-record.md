---
title: "destroy must reset _previouslyNewRecord to false before freeze (Rails persistence.rb:457)"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #3279 (`destroy-reload-association-cache-clear-semantics`).

Rails `#destroy` resets the previously-new-record flag before freezing
(`active_record/persistence.rb:455-457`):

```ruby
@destroyed = true
@previously_new_record = false
freeze
```

Trails `destroy` (`base.ts`, the `_destroyed = true; this.freeze()` tail) does
**not** reset `_previouslyNewRecord`. The flag is reset in `deleteRow`
(`Persistence#delete`), `saveRow`, and `clone`, but the callback-bearing
`destroy` path omits it. After `create` → `destroy`, `previouslyNewRecord()`
returns a stale `true` in trails vs `false` in Rails.

Note `_newRecordBeforeLastCommit = false` (set in the `didDelete` branch) is a
**different** flag (`@_new_record_before_last_commit`, used by transaction
commit callbacks) and does not cover `@previously_new_record`.

## Acceptance criteria

- [ ] `destroy` sets `_previouslyNewRecord = false` before `freeze`, matching
      `persistence.rb:457`.
- [ ] A test mirroring the Rails behavior (created-then-destroyed record reports
      `previouslyNewRecord == false`); no test renames; `api`/`test:compare`
      delta non-negative.
