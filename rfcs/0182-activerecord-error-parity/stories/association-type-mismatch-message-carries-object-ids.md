---
title: "activerecord: AssociationTypeMismatch takes Rails' message, object ids included"
status: done
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: errors
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8595
claim: "2026-10-06T20:03:11Z"
assignee: "activerecord-burn-rails-callback-invocations-exclude"
blocked-by: null
closed-reason: null
---

## Context

`Association#raise_on_type_mismatch!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:310-318`) builds one message and raises with it:

```ruby
message = "#{reflection.class_name}(##{reflection.klass.object_id}) expected, "\
  "got #{record.inspect} which is an instance of #{record.class}(##{record.class.object_id})"
raise ActiveRecord::AssociationTypeMismatch, message
```

trails' `raiseOnTypeMismatchBang` (`packages/activerecord/src/associations/association.ts`, converged for control flow in trails#8449) still deviates in three ways:

- `AssociationTypeMismatch` (`packages/activerecord/src/errors.ts:16-21`) takes `(expected, actual)` and assembles `"#{expected} expected, got #{actual}"` itself. Rails' class takes a message (`errors.rb`, plain `ActiveRecordError` subclass).
- Both `(#object_id)` segments are dropped.
- `record.inspect` goes through the file-local `inspectMismatchedRecord` helper, which Rails does not have, instead of `rbInspect`.

`associations/belongs-to-associations.test.ts:646` asserts the message with a regexp that has no object-id segment.

## Acceptance criteria

- [ ] `AssociationTypeMismatch` takes a message, like every other `ActiveRecordError` subclass, and every `new AssociationTypeMismatch(` site passes one.
- [ ] `raiseOnTypeMismatchBang` builds Rails' message, object ids included (ruby-compat's object-id helper), and uses `rbInspect(record)`.
- [ ] `inspectMismatchedRecord` is deleted.
- [ ] The Rails tests asserting this message are ported with Rails' assertion.
