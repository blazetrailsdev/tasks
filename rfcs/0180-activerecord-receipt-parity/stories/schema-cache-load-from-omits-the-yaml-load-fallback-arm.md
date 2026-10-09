---
title: "activerecord: SchemaCache._load_from omits the YAML.respond_to?(:unsafe_load) guard and its YAML.load arm"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
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

Surfaced by trails#8703.

`SchemaCache._load_from` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:235-239`) is

```ruby
if YAML.respond_to?(:unsafe_load)
  YAML.unsafe_load(file)
else
  YAML.load(file)
end
```

`packages/activerecord/src/connection-adapters/schema-cache.ts` `_loadFrom` calls `YAML.unsafeLoad(file)` with no guard and no `else` arm. ruby-compat's `Psych` namespace (`packages/ruby-compat/src/psych.ts`) ports `dump` and `unsafeLoad` only; `Psych.load` (`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:368`, `safe_load` with `permitted_classes: [Symbol]`) is not ported, so the arm has nothing to call. The omission carries no receipt because no gate flagged it.

## Acceptance criteria

- [ ] `Psych.load` is ported in `packages/ruby-compat/src/psych.ts` at its MRI shape, with a `*.trails.test.ts` case.
- [ ] `_loadFrom`'s YAML arm has Rails' `respond_to?` guard and both calls, in Rails' order.
- [ ] `packages/activerecord/src/connection-adapters/schema-cache.test.ts` green; `pnpm parity:api:calls` green.
