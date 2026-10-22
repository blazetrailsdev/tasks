---
title: "ActiveJob.adapter_name answers is_a?(Module) for a plain-object module adapter"
status: claimed
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-22T15:46:39Z"
assignee: "port-activejob-test-helper-test-performed-part-3"
blocked-by: null
closed-reason: null
---

## Context

`ActiveJob.adapter_name` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapter.rb:7-12`) picks
`adapter.is_a?(Module) ? adapter : adapter.class`. trails' `adapterName`
(`packages/activejob/src/queue-adapter.ts`, PR trails#9186) answers the Module arm with
`typeof adapter === "function"`, so a plain-object module adapter (Rails' `StubThreeAdapter`
module with singleton `enqueue`/`enqueue_at`, `test/cases/queue_adapter_test.rb:77-88`) falls
to `rbObjClass(adapter)` and is named `"hash"`. The trails test ports StubThreeAdapter as a class.

## Acceptance criteria

- [ ] `adapterName` answers the `is_a?(Module)` arm for a plain-object module (RFC 0197 module shape), via a ruby-compat `rbObjIsKindOf(adapter, Module)`-equivalent, not a `typeof` probe.
- [ ] "should extract a reasonable name from a class or module" uses a plain-object `StubThreeAdapter` as Rails' module and passes.
