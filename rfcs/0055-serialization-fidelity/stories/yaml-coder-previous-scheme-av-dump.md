---
title: "YAML-coder previous-scheme AV dump on Serialized(Encrypted) — verify Rails parity, pin behavior"
status: done
updated: 2026-07-23
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5164
claim: "2026-07-23T17:04:25Z"
assignee: "yaml-coder-previous-scheme-av-dump"
blocked-by: null
closed-reason: null
---

# YAML-coder previous-scheme AV dump on Serialized(Encrypted) — verify Rails parity, pin behavior

## Context

PR #5155 converged the JSON-coder path: a previous-scheme
`AdditionalValue` reaching `Serialized.serialize`
(`packages/activerecord/src/type/serialized.ts:295-303`) now raises
`NoMethodError` via `ActiveSupportJSON.encode`'s as_json traversal
(`packages/activesupport/src/json.ts` generic-object branch →
`Type#asJson`, activemodel `type/value.ts:108-110`; Rails
`ActiveModel::Type::Value#as_json`, value.rb:145).

The YAML coder path is NOT covered: Rails' `Coders::YAMLColumn#dump`
(vendor/rails/activerecord/lib/active_record/coders/yaml_column.rb) goes
through Psych `safe_dump` with `permitted_classes`, not as_json — so a
deterministic `serialize(..., coder: YAML)` + encrypts + previous_schemes
lookup in Rails presumably raises `Psych::DisallowedClass` (AV is not
permitted), or with `unsafe_load`/permitted classes could dump AV
internals (previous-scheme `EncryptedAttributeType`, key material) into an
encrypted garbage candidate. Trails' `YamlColumn.dump`
(`packages/activerecord/src/coders/yaml-column.ts`) has its own dump
mechanics and its AV behavior is unverified. Repro recipe: see
`extended-deterministic-queries.trails.test.ts` ("raises NoMethodError
when a previous-scheme candidate reaches the serialized coder") — swap
the coder to yaml. NOTE for vendored-Rails repros: `extend_queries: true`
alone does nothing outside a railtie boot — call
`ExtendedDeterministicQueries.install_support` manually
(railtie.rb:351-353), or `serialize_with_oldest?` masks the whole path.

## Acceptance criteria

- Reproduce in vendored Rails (encrypts + serialize coder: YAML +
  previous_schemes + deterministic where, with install_support called)
  and document what Rails does (raise class or dumped payload).
- Converge trails' YamlColumn AV handling to that behavior and pin it
  with a trails guard test (fails on baseline); confirm no scheme/key
  material lands in binds.
