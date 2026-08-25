---
title: "converge-association-build-record-build-association"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6380
claim: "2026-08-11T21:46:04Z"
assignee: "converge-association-build-record-build-association"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burndown-associations` (RFC 0084) after the post-0083 re-measure.

Rails `Association#build_record`
(vendor/rails/activerecord/lib/active_record/associations/association.rb:383-388):

```ruby
def build_record(attributes)
  reflection.build_association(attributes) do |record|
    initialize_attributes(record, attributes)
    yield(record) if block_given?
  end
end
```

trails' `buildRecord` (`packages/activerecord/src/associations/association.ts:734`)
skips `reflection.buildAssociation` entirely and does
`new (Klass as any)(attributes ?? {}, (r) => this.initializeAttributes(r, attributes))`.
It also drops the `yield(record) if block_given?` arm — `buildRecord` takes no
block parameter at all, so a caller-supplied block never reaches the record
before `_run_initialize_callbacks`.

Wide-ratchet row: `associations/association.ts | build_record | build_association → buildAssociation`.

## Acceptance criteria

1. `buildRecord` routes through `reflection.buildAssociation(attributes)` with
   the initialize block, matching Rails' decomposition.
2. The block arm is ported: `buildRecord(attributes, block?)` yields the record
   after `initializeAttributes`, at the same point Rails does.
3. Retire the `build_record` row from
   `scripts/api-compare/call-mismatches-exclude/activerecord/associations/association.json`
   by hand (only-shrink; no `--write` reseed).
4. Verified against `vendor/rails/activerecord/test/cases/associations/` build
   paths (`has_many_associations_test.rb`, `has_one_associations_test.rb`) plus
   the `after_initialize` ordering tests.
