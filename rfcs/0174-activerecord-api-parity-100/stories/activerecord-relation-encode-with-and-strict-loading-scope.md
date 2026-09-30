---
title: "activerecord: Relation#encode_with and Relation::StrictLoadingScope"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: ["psych-object-to-yaml"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation.rb → relation.ts` scores 406/409. The misses:

- `Relation#encode_with` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:348`) — `coder.represent_seq(nil, records)`,
  how a relation dumps to YAML.
- `Relation::StrictLoadingScope.empty_scope?` / `.strict_loading_value`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`, the `StrictLoadingScope` module used by `Relation#_create*` to run the create
  block under `strict_loading`).

`encode_with` needs Psych's coder (RFC 0170, `psych-object-to-yaml`); the `StrictLoadingScope` pair is
plain Ruby.

## Acceptance criteria

- [ ] `StrictLoadingScope` is ported in `relation.ts` with both singleton methods, and the create paths use it where Rails does.
- [ ] `Relation#encodeWith` represents the loaded records as a sequence through ruby-compat Psych's coder.
- [ ] `relation.rb` scores 409/409.
