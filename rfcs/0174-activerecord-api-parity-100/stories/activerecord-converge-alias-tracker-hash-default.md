---
title: "activerecord: AliasTracker.create builds Hash.new(0) (args shape row)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
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

`call-mismatches-exclude/activerecord/associations/alias-tracker.json` — `create` → `new`, rubyArgs
`[num:0]`: `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/alias_tracker.rb:9` builds `Hash.new(0)` for `aliases`; the
port passes a proc to the `AliasTracker` constructor because "a JS Map has no default". ruby-compat's
`Hash` (`packages/ruby-compat/src/hash.ts`) carries Ruby's `default` seat.

## Acceptance criteria

- [ ] `create` builds `new Hash(0)` from ruby-compat and `AliasTracker` reads it as Rails does; the row is deleted and the shard mark tightened.
