---
title: "has-many-through-has-one-inverse-sends-writer"
status: draft
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
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

## Context

`HasManyThroughAssociation#build_record`'s has_one inverse arm (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:106-107`) is:

```ruby
elsif inverse.has_one?
  record.send("#{inverse.name}=", build_through_record(record))
```

Trails (`packages/activerecord/src/associations/has-many-through-association.ts`, the `inverse.isHasOne()` arm) instead calls `HasOneAssociation#syncWrite` through an `as unknown as { syncWrite }` cast. `syncWrite` (`has-one-association.ts`) is `replace(record, false)` and has no Rails counterpart: `sync_write` appears nowhere under `vendor/rails/v8.0.2/activerecord/lib`.

The generated writer (`builder/association.ts` `defineWriters`) calls `association(name).writer(value)`, which is `replace(record)` with the save. On a persisted owner, the writer saves where `syncWrite` does not. That is why trails#9127 did not switch this call site: it is a runtime change, and that PR was typing-only. Making `syncWrite` public with `@internal` was also rejected, by `blazetrails/unbacked-internal-needs-receipt`.

`base.ts:500-522` (`_ConstructorAssociationWriter`) reaches `syncWrite` too, for the constructor's association assignment.

## Acceptance criteria

- [ ] The has_one arm sends the inverse writer (`rbFSend` with the `"${inverse.name}="` writer name), or an equivalent call that reaches `HasOneAssociation#writer`, as Rails does. Verify against `has_many_through_associations_test.rb` that the save the writer runs matches Rails.
- [ ] The `as unknown as { syncWrite }` cast is gone.
- [ ] If `syncWrite` has no caller left outside the constructor path, decide its fate with the `base.ts` constructor writer in the same PR, or record why it stays.
