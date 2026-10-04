---
title: "Port hash and eql? on Attribute, Error and Type::Value"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: api-surface
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8468
claim: "2026-10-04T01:11:32Z"
assignee: "activemodel-port-hash-and-eql-on-attribute-error-and-type-value"
blocked-by: null
closed-reason: null
---

## Context

`parity:api --package activemodel` (main @ `1ff8779ff5`, 2026-10-03) reports 815/821 methods. All six misses are `hash` / `eql?`, which became scored names in trails#8214 (protocol-definition scoring):

- `ActiveModel::Attribute`: `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:115-125`. `==` compares class, `name`, `value_before_type_cast` and `type`; `alias eql? ==`; `hash` is `[self.class, name, value_before_type_cast, type].hash`.
- `ActiveModel::Error`: `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:190-197`. `==` is `other.is_a?(self.class) && attributes_for_hash == other.attributes_for_hash`; `alias eql? ==`; `hash` is `attributes_for_hash.hash`.
- `ActiveModel::Type::Value`: `vendor/rails/v8.0.2/activemodel/lib/active_model/type/value.rb:121-131`. `==` compares class, `precision`, `scale` and `limit`; `alias eql? ==`; `hash` is `[self.class, precision, scale, limit].hash`.

The trails `==` ports are `equals` at `packages/activemodel/src/attribute.ts:187`, `error.ts:288` and `type/value.ts:101`. None of the three classes defines `hash` or `eql`.

Precedent: `packages/activerecord/src/normalization.ts:130-134` defines `eql(other)` / `hash(): number`. ruby-compat's `rbHash` / `rbEqual` dispatch to a TS `hash()` / `eql()` (CLAUDE.md § "Ruby protocol methods with a different JS mechanism").

Tooling discrepancy to resolve first: the compare's `missingMethods` lists the expected TS name for `eql?` as `isEql`, but CLAUDE.md says `eql?` is scored as `eql`. Check `scripts/parity/conventions.ts` and the normalization.ts pair. If the predicate rule is overriding the protocol rule, fix the convention there rather than spelling the member `isEql`.

## Acceptance criteria

- `Attribute`, `Error` and `Type::Value` each define `eql(other)` with the same body as their `equals` (Ruby's `alias eql? ==`) and a `hash()` built from the same tuple Rails hashes, via ruby-compat's `rbHash`.
- `Error#hash` / `eql` go through `attributesForHash`, as Rails' do.
- `parity:api --package activemodel` reports 821/821 methods.
- `parity:api:calls`, `:calls:args`, `:extra:gate` and `:pins` stay green.
- Tests: port any Rails assertions on `hash` / `eql?` from `attribute_test.rb`, `error_test.rb` and `type/value_test.rb`. If Rails has none, add a `.trails.test.ts` case per class showing equal records hash equal under `rbHash`.
