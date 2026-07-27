---
title: "Converge FakeActiveRecordAdapter's superclass onto AbstractAdapter"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the first `api:compare --package activerecord-test-support` run
(PR #5433, story `wire-test-support-into-api-compare`), which reports
inheritance 1/2 for the new package:

````text
FakeActiveRecordAdapter  fake_adapter.rb -> fake-adapter.ts
  rubySuper: AbstractAdapter   tsSuper: FakeAdapterBase   (super-mismatch)
```text

Rails' `test/support/fake_adapter.rb` defines
`FakeActiveRecordAdapter < ActiveRecord::ConnectionAdapters::AbstractAdapter`.
trails' `packages/activerecord/src/support/fake-adapter.ts` interposes a
`FakeAdapterBase` class instead, so the port's superclass chain does not reach
`AbstractAdapter` the way Rails' does.

This is a structural deviation, not a missing method — the method-level gaps in
the same package are tracked separately by
[[converge-test-support-api-compare-gaps]].

## Acceptance criteria

- Either `FakeActiveRecordAdapter` extends the trails `AbstractAdapter` directly
  (matching Rails), or `FakeAdapterBase` is justified at its definition site
  with the reason it must sit in between — read
  `vendor/rails/activerecord/test/support/fake_adapter.rb` first and state what
  trails' AbstractAdapter requires that Rails' does not.
- `pnpm api:compare --package activerecord-test-support` reports inheritance
  2/2, or the mismatch is recorded as a reasoned exclusion.
- Every `fake-adapter.ts` consumer still passes.
````
