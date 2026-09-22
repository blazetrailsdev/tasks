---
title: "activemodel-attributes-have-no-marshal-round-trip"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`attributes_test.rb:131-138` round-trips a model through
`Marshal.load(Marshal.dump(data))` and asserts the reloaded `@attributes` equals the
original — the regression cover for a `-> { Date.new(2016, 1, 1) }` proc default
surviving marshalling.

Ruby gets that from generic object marshalling; JS has no counterpart. There is no
`Marshal` in `ruby-compat` or `activesupport`, and activemodel has no
`marshal_dump` / `marshal_load` pair (activerecord's `marshalling.ts` covers
`ActiveRecord::Base` only, and `errors_test.rb`'s `errors are marshalable` is
already parked for the same reason — `activemodel-errors-has-no-marshal`).

`packages/activemodel/src/attributes.test.ts` therefore parks the test as
`it.skip` with a `dup()` stand-in for the round trip, carrying the Rails
assertion so the assertion histogram stays at 0 mismatches.

## Acceptance criteria

- [ ] Decide whether a `Marshal`-equivalent round trip is portable for an
      ActiveModel object carrying an `AttributeSet` with proc defaults, or whether
      the absence is permanent.
- [ ] If portable: un-skip `attributes with proc defaults can be marshalled` in
      `packages/activemodel/src/attributes.test.ts` and assert against the real
      round trip.
- [ ] If not: record the language shortcoming where the other parked marshal rows
      are recorded, and keep the skip.
