---
title: "delegate.ts raises a bare Error for a missing association reflection"
status: done
updated: 2026-09-01
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 3
pr: 7337
claim: "2026-09-01T13:13:23Z"
assignee: "collection-writer-is-async-even-when-it-owes-no-io"
blocked-by: null
closed-reason: null
---

# delegate.ts raises a bare `Error` for a missing association reflection

## Context

`delegate.ts:29-35` generates the delegating method with its own pre-check:

```ts
const assocDef = (ctor as any)._reflectOnAssociation?.(assocName);
if (!assocDef) {
  throw new Error(`Association "${assocName}" not found on ${ctor.name}`);
}
```

Rails has no such guard. `delegate :x, to: :some_association`
(`activesupport/lib/active_support/core_ext/module/delegation.rb:160-209`)
emits a body that simply calls the target — so a name with no reflection
surfaces through `Associations#association`, which raises
`AssociationNotFoundError` at `activerecord/lib/active_record/associations.rb:51-62`:

```ruby
unless reflection = self.class._reflect_on_association(name)
  raise AssociationNotFoundError.new(self, name)
end
```

This is the same defect PR #7141 fixed in `associations.ts` under
[[collection-reader-missing-reflection-raises-bare-error]]; that story's scope
was `associations.ts`, and this call site is the remaining twin. trails already
has the helper — `_associationNotFound(record, name)` (`associations.ts:353-357`)
builds the real error with Rails' DidYouMean `corrections`
(`activerecord/lib/active_record/associations/errors.rb`).

## Converged shape

Drop the invented pre-check so the generated body reaches `association()` and
raises there, as Rails does. If a guard must stay for the `?.` optional-call
path, it raises `_associationNotFound(this, assocName)` — never a bare `Error`.

Callers matching on the message string (if any) move to
`instanceof AssociationNotFoundError`.

## Acceptance criteria

- [ ] No bare `Error` for a missing reflection remains in `delegate.ts`.
- [ ] A missing delegated association raises `AssociationNotFoundError` with
      Rails' message and `corrections`.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative.
