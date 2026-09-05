---
title: "NumericalityValidator#prepare_value_for_validation reads _read_attribute where Rails reads the public read_attribute"
status: in-progress
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7509
claim: "2026-09-05T03:42:13Z"
assignee: "fast-string-to-time-construct-through-time-new"
blocked-by: null
closed-reason: null
---

## Context

`NumericalityValidator#prepare_value_for_validation` reaches the record's
attribute through the PUBLIC `read_attribute`, guarded by `respond_to?`
(`vendor/rails/activemodel/lib/active_model/validations/numericality.rb:130-131`):

```ruby
elsif record.respond_to?(:read_attribute)
  raw_value = record.read_attribute(attr_name)
end
```

trails reaches a PRIVATE one instead
(`packages/activemodel/src/validations/numericality.ts:257-259`):

```ts
} else if (typeof r._readAttribute === "function") {
  rawValue = r._readAttribute(attrName);
}
```

`_readAttribute` is `_read_attribute` — a different Rails method
(`activerecord/lib/active_record/attribute_methods/read.rb:35`), the unaliased
fast path that skips `resolve_attribute_name`. `read_attribute`
(`read.rb:22-25`) resolves the attribute alias first, so an aliased attribute
under a numericality validation reads the wrong name in trails, or reads nothing
where Rails would have found the value. The `respond_to?` guard also differs in
population: every AR model answers `_read_attribute`, so the guard that Rails
uses to distinguish an AR record from a bare ActiveModel one is not the same
test here.

Surfaced reviewing this method while wiring the `record_attribute_changed_in_place?`
short-circuit (PR #7478, story `wire-numericality-changed-in-place-short-circuit`) —
out of scope there, which was a two-line guard at the top of the same body.

## Converged shape

Call the public `readAttribute`, guarded on the public name, so an aliased
attribute resolves the way Rails resolves it:

```ts
} else if (typeof r.readAttribute === "function") {
  rawValue = r.readAttribute(attrName);
}
```

Confirm `RecordWithRawAttribute` (numericality.ts:269-273) declares
`readAttribute` rather than `_readAttribute`, and check whether the aliased-attribute
case wants a test — `test_aliased_attribute`
(`vendor/rails/activerecord/test/cases/validations/numericality_validation_test.rb:160`)
is the nearest Rails coverage.

## Acceptance criteria

- [ ] `prepareValueForValidation`'s middle arm calls the public `readAttribute`,
      matching `numericality.rb:130-131`.
- [ ] An attribute alias under numericality validation reads through the alias.
- [ ] `pnpm parity:api:calls` non-negative; numericality suites green in
      activemodel and activerecord.
