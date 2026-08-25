---
title: "find-one-raises-on-active-record-instance-arg"
status: draft
updated: 2026-08-16
rfc: "0111-error-class-message-parity"
cluster: message-string-parity
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `find_one` drops Rails' ActiveRecord::Base-instance ArgumentError

## Context

Rails' `find_one` opens with a guard
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:530-536`):

```ruby
def find_one(id)
  if ActiveRecord::Base === id
    raise ArgumentError, <<-MSG.squish
      You are passing an instance of ActiveRecord::Base to `find`.
      Please pass the id of the object by calling `.id`.
    MSG
  end
  ...
```

trails' `findOne` (`packages/activerecord/src/relation/finder-methods.ts`, the
`export async function findOne`) has never carried it — confirmed on
`origin/main` as well as on PR #6589, which converged the rest of the body
(`where(...)` + `.take`) but left the guard out of scope. Passing a record to
`find` therefore falls through to a `where({ id: <record> })` lookup instead of
raising.

The sibling guards are already ported and tested — `exists?`
(`finder.test.ts:2434`), `update` / `update!` (`persistence.test.ts:634,:673`) —
so the message string and error class are settled; only the `find` arm is
missing. Related story: `exists-raises-on-active-record-instance-arg`.

## Acceptance criteria

- [ ] `findOne` raises `ArgumentError` with Rails' squished message
      ("You are passing an instance of ActiveRecord::Base to `find`. Please pass
      the id of the object by calling `.id`.") before building the relation.
- [ ] Guard placed first in the body, matching Rails' branch order.
- [ ] Covered by a test asserting class + message, failing on baseline.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
