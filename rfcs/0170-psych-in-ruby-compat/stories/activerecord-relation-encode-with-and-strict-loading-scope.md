---
title: "activerecord: Relation#encode_with"
status: ready
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: api-surface
packages: ["activerecord"]
deps: ["psych-object-to-yaml"]
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

Narrowed on 2026-10-11. The `StrictLoadingScope` half moved to
`relation-strict-loading-scope-class-and-class-specific-relation-name` (RFC 0156), which waits on
nothing. This story keeps the one row that needs Psych.

`Relation#encode_with` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:347-350`) is

```ruby
def encode_with(coder)
  coder.represent_seq(nil, records)
end
```

so a relation dumps to YAML as the Array of its records. `coder` is a `Psych::Coder`, and
`represent_seq` is its method. trails has no `representSeq` anywhere yet: ruby-compat's Psych coder
arrives with `psych-object-to-yaml`, which is this story's dep. Do not port against a local structural
interface standing in for the coder.

Rails exercises it through `Bird.all.to_yaml`
(`vendor/rails/v8.0.2/activerecord/test/cases/relations_test.rb:79-82`) and `[Topic.all].to_yaml`
(`vendor/rails/v8.0.2/activerecord/test/cases/yaml_serialization_test.rb:49`).

## Acceptance criteria

- [ ] `Relation#encodeWith(coder)` in `packages/activerecord/src/relation.ts` is
      `coder.representSeq(null, records)` against ruby-compat Psych's coder, at its Rails position.
- [ ] "to yaml" in `relations.test.ts` runs Rails' body.
- [ ] `relation.rb` has no missing `encode_with` row in `parity:api`.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
