---
title: "DeleteRestrictionError takes Rails' single optional name, not (record, association)"
status: draft
updated: 2026-08-07
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/associations/errors.rb` (Rails
8.1) defines:

```ruby
class DeleteRestrictionError < ActiveRecordError
  def initialize(name = nil)
    if name
      super("Cannot delete record because of dependent #{name}")
    else
      super("Delete restriction error.")
    end
  end
end
```

One optional argument, and a bare-`new` message arm. trails' version
(`packages/activerecord/src/associations/errors.ts:359-369`) takes two required
arguments `(record, association)` and carries a `record` field Rails does not
have, so every raise site passes an extra `owner`:

- `associations/has-one-association.ts:196` — Rails raises
  `ActiveRecord::DeleteRestrictionError.new(reflection.name)`
  (`has_one_association.rb:11`).
- `associations/has-many-association.ts` `handleDependency` — same shape
  (`has_many_association.rb:14`).

The extra argument is why the `order:reflection,constructor` call row on
`has-one-association.ts::handle_dependency` survives in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-one-association.json`
even though the rest of that body now matches Rails line for line.

## Converged shape

```ts
export class DeleteRestrictionError extends ActiveRecordError {
  constructor(name?: string) {
    super(name ? `Cannot delete record because of dependent ${name}` : "Delete restriction error.");
    this.name = "DeleteRestrictionError";
  }
}
```

Then update the raise sites to pass only `this.reflection.name`, and drop the
`record` / `association` fields (check `errors.test.ts:93,177` and any assertion
reading `.record` off this error first).

## Acceptance criteria

- [ ] `DeleteRestrictionError` takes Rails' single optional `name`, with both
      message arms.
- [ ] Every raise site passes only the reflection name.
- [ ] The `order:reflection,constructor` row on
      `has-one-association.ts::handle_dependency` is re-checked and deleted from
      its shard if it converges (only-shrink, hand-edit via `serializeBaseline`).
- [ ] `pnpm parity:api:calls` green; AR association suites pass on all three lanes.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
