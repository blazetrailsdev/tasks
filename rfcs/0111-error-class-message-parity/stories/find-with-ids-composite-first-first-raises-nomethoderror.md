---
title: "find-with-ids-composite-first-first-raises-nomethoderror"
status: done
updated: 2026-09-10
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7663
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging
`normalize-find-args-invents-a-composite-arity-error-and-string-coerces-the-key`,
which dropped the invented composite-arity `RecordNotFound` from
`normalizeFindArgs` (`packages/activerecord/src/relation/finder-methods.ts`).

That story assumed a composite-PK `find(1)` reaches `find_one` and raises
`RecordNotFound`. It does not. Rails' `find_with_ids`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:492-497`)
computes

```ruby
expects_array = if model.composite_primary_key?
  ids.first.first.is_a?(Array)
```

and `ids.first` is the Integer `1`, so `1.first` raises
`NoMethodError: undefined method 'first' for an instance of Integer`
(verified against MRI). The same applies to a composite `find(1, 2)`.

trails instead spells `expects_array` as
`Array.isArray(first) && Array.isArray(first[0])`, which never raises, and adds
a variadic-tuple branch (`rest.length > 0 && args.every(!Array.isArray)` →
`ids = [args]`) that Rails does not have, so a composite `find(1)` now flows
into `findOne` with a non-Array id.

## Acceptance criteria

- [ ] `normalizeFindArgs`' composite arm mirrors `find_with_ids`'
      `ids.first.first.is_a?(Array)`, so a composite `find(1)` / `find(1, 2)`
      raises `NoMethodError` as Rails does.
- [ ] The trails-only variadic-tuple branch is removed, or a Rails `file:line`
      is cited for it.
- [ ] Composite-primary-key finder suites stay green on all three adapters.
