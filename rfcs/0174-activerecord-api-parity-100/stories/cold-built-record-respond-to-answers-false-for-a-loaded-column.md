---
title: "activerecord: a record built before its schema loaded answers respond_to? false for a column"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `ar-attribute-methods-respond-to-missing-is-not-ported`
(trails#8732), which ported `AttributeMethods#respond_to_missing?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:464-471`).

That story's acceptance test could not hold. For a record built before its
schema loaded, `respondToMissing("title")` now answers true once
`await Klass.loadSchema()` has run, but `rbObjRespondTo(record, "title")` still
answers false: `respond_to?` (`attribute_methods.rb:291-306`) ends in

```ruby
if @attributes
  if name = self.class.symbol_column_to_string(name.to_sym)
    return _has_attribute?(name)
  end
end
```

and the cold-built record's `@attributes` was built from an empty column set,
so `_has_attribute?("title")` is false. `isRespondTo`
(`packages/activerecord/src/attribute-methods.ts`) is Rails' body; the
divergence is the attribute set, which in Rails cannot be built before
`load_schema` (`column_names` loads it in line). `send(:title)` on the same
record dispatches through `methodMissing`.

`save-chain-schema-warm-and-cold-built-records` (RFC 0174) covers the save
path of the same records.

## Acceptance criteria

- [ ] A record built against a cold schema cache answers
      `rbObjRespondTo(record, "title")` true once the schema is loaded, with no
      change to `isRespondTo`'s body: its attribute set is rebuilt or completed
      from the loaded columns at the point Rails' in-line `load_schema` would
      have supplied them.
- [ ] A `.trails.test.ts` case covers it; `attribute-methods.trails.test.ts`'s
      "defines the attribute methods for a record built before its schema
      loaded" gains the `rbObjRespondTo(topic, "title")` assertion.
