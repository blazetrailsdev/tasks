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

On the `/feed` benchmark of `examples/twelve-dollar-server` (profile taken 2026-10-30, after trails#9482), `basicObjRespondTo` (`packages/ruby-compat/src/object.ts:694`) is the largest single JS function: 3.8% of self time, and 1.9% on `/posts/250000`. Rails has no comparable cost. 73% of those samples come from one caller, `instantiateInstanceOf` (`packages/activerecord/src/persistence.ts:968`, the check at `:980`), so it runs per loaded record. Rails' `instantiate_instance_of` (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:311`) is `klass.allocate.init_with_attributes(...)` with no such check. The loop is not removable: it defines a singleton reader for a selected column that is not a real attribute (an alias, for example), which Rails answers through a record's `method_missing` (`activerecord/lib/active_record/attribute_methods.rb`). Records are not Proxies (CLAUDE.md § "Records are not Proxies"), so that behaviour has to stay. On a record every name misses the `core` classification in `basicObjRespondTo`, after a chain of `instanceof` tests.

## Acceptance criteria

- The per-record, per-name `basicObjRespondTo` loop is replaced by an answer computed once per class and result shape (the column-name set), so a repeated query shape does no per-name check.
- A selected alias still reads as a property on every record, covered by a test.
- `basicObjRespondTo` is at most 1% of `/feed` self time on the same profile.
- `/feed` CPU per request does not regress; any cache carries a `@perf` tag with the measurement.
- Existing tests for `instantiate` pass with no change to their names.
