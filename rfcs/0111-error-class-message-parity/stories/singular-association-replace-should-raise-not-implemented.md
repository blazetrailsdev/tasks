---
title: "singular-association-replace-should-raise-not-implemented"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `SingularAssociation#replace` is concrete where Rails raises `NotImplementedError`

## Context

Rails' `SingularAssociation#replace`
(`activerecord/lib/active_record/associations/singular_association.rb:57-59`)
is abstract:

```ruby
def replace(record)
  raise NotImplementedError, "Subclasses must implement a replace(record) method"
end
```

trails ships a concrete body in
`packages/activerecord/src/associations/singular-association.ts` — set/remove
the inverse instance, then `this.target = record` — which after PR #6684 also
marks the association loaded through the setter (`association.rb:100-103`).
`BelongsToAssociation#replace` (`belongs_to_association.rb:95-107`) and
`HasOneAssociation#replace` (`has_one_association.rb:59-90`) both override it,
so the base body only runs for subclasses that Rails would have made raise.

Surfaced while auditing `self.target =` callers for
`association-target-setter-must-call-loaded-bang` (PR #6684).

## Converged shape

- Establish which callers reach the base body (grep `setNewRecord` /
  `replace` on `SingularAssociation` subclasses that do not override it) and
  give each the Rails-side body it should have had; the base then raises
  `NotImplementedError` with Rails' message, matching
  `singular_association.rb:57-59`.

## Acceptance criteria

- [ ] `SingularAssociation#replace` raises `NotImplementedError` with Rails'
      message, and every subclass reaching it has its own `replace`.
- [ ] Association / has_one / belongs_to suites green on SQLite, PostgreSQL
      and MySQL/MariaDB.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
