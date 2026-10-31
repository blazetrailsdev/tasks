---
title: "Loading a record stops paying basicObjRespondTo per record"
status: draft
updated: 2026-10-31
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

On the `/feed` benchmark of `examples/twelve-dollar-server` (profile taken 2026-10-30, after trails#9482), `basicObjRespondTo` (`packages/ruby-compat/src/object.ts:694`) is the largest single JS function: 3.8% of self time, and 1.9% on `/posts/250000`. Rails has no comparable cost. 73% of those samples come from one caller, `instantiateInstanceOf` (`packages/activerecord/src/persistence.ts:968`, the check at `:980`), so it runs per loaded record. Rails' `instantiate_instance_of` (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:311`) is `klass.allocate.init_with_attributes(...)` with no such check. On a record every name misses the `core` classification in `basicObjRespondTo`, after a chain of `instanceof` tests.

## Acceptance criteria

- The check at `persistence.ts:980` is removed, or runs once per class rather than per record, keeping behaviour; if it is an arm Rails lacks, it converges toward Rails' body.
- `basicObjRespondTo` is at most 1% of `/feed` self time on the same profile.
- `/feed` CPU per request does not regress; any cache carries a `@perf` tag with the measurement.
- Existing tests for `instantiate` pass with no change to their names.
