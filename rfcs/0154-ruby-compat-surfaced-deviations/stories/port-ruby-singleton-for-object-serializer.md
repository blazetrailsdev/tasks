---
title: "Port Ruby Singleton and converge ObjectSerializer's hand-written instance()"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/serializers/object_serializer.rb:26-31` is
`include Singleton` + `class << self; delegate :serialize?, :serialize, :deserialize, to: :instance; end`.
ruby-compat has no port of Ruby stdlib `Singleton` (`vendor/ruby/v3.3.11/lib/singleton.rb`), so
`packages/activejob/src/serializers/object-serializer.ts` (trails#8949) hand-writes a static
`instance()` memo (own-property `_instance`) and three hand-written static delegators.

## Acceptance criteria

- [ ] ruby-compat ports `Singleton` (`instance`, per-class memo, private `new`) as an includable module.
- [ ] `ObjectSerializer` includes it and its class-level `isSerialize` / `serialize` / `deserialize` come from `delegate(..., { to: "instance" })` on the class, not hand-written statics.
- [ ] The hand-written `instance()` is gone.
