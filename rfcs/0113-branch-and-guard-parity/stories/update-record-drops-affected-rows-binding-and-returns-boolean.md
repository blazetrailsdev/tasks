---
title: "_update_record drops Rails' affected_rows binding and returns a boolean instead of the count"
status: done
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 4
pr: 7291
claim: "2026-08-31T14:08:44Z"
assignee: "inline-ruby-bodies-extracted-as-named-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `_update_record`'s parameter list in PR #7201; out of
that story's scope, which was the signature only.

Rails' `_update_record` binds `affected_rows` in **both** arms and returns it —
the method's documented contract is "Returns the number of affected rows"
(`vendor/rails/activerecord/lib/active_record/persistence.rb:897-912`):

```ruby
def _update_record(attribute_names = self.attribute_names)
  attribute_names = attributes_for_update(attribute_names)

  if attribute_names.empty?
    affected_rows = 0
    @_trigger_update_callback = true
  else
    affected_rows = _update_row(attribute_names)
    @_trigger_update_callback = affected_rows == 1
  end

  @previously_new_record = false

  yield(self) if block_given?

  affected_rows
end
```

The port (`packages/activerecord/src/persistence.ts:1056-1073`,
`instanceUpdateRecord`) drops the `affected_rows = 0` binding in the empty arm,
scopes the other binding to the `else` block, and returns a bare `true`:
declared `Promise<boolean>` where Rails returns an Integer.

It is silent today by coincidence, not by design. `Dirty#_update_record`'s
`affected_rows = super` (`attribute_methods/dirty.rb:234`) returns whatever it
receives, and `create_or_update`'s coercion is `result != false`
(`persistence.rb:894`) — under which Ruby's `0` and the port's `true` agree.
Any caller that reads the count instead of its truthiness diverges, and the
`_create_record` sibling has the same shape (it returns the id in Rails).

## Converged shape

Bind `affectedRows` in both arms, `0` in the empty one, and return it; the
return type becomes `Promise<number>`. Then walk the super chain — the Dirty and
Timestamp layers and `callbacks.ts#_updateRecord` — so nothing coerces the count
to a boolean before `create_or_update` applies Rails' own `result != false`
(`base.ts`'s `save` and `createOrUpdate`).

## Acceptance criteria

- `instanceUpdateRecord` returns the affected-row count, `0` in the empty arm,
  and is typed `Promise<number>`.
- No intermediate layer in the chain narrows it to a boolean earlier than Rails
  does.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no new row.
- AR suite green on all three lanes.
