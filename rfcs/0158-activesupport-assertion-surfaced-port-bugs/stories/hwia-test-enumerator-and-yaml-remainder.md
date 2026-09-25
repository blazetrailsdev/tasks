---
title: "hash_with_indifferent_access_test: Enumerator and YAML dump remainder"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8063
claim: "2026-09-24T23:24:18Z"
assignee: "hwia-test-enumerator-and-yaml-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-hash-cluster-remainder` (trails#7840), `packages/activesupport/src/hash-with-indifferent-access.test.ts` vs `vendor/rails/activesupport/test/hash_with_indifferent_access_test.rb`:

- `indifferent select returns enumerator` / `indifferent reject returns enumerator` (`:379-387`): `select`/`reject` without a block return `to_enum(:select)` (`vendor/rails/activesupport/lib/active_support/hash_with_indifferent_access.rb:323-331`). Trails has no `Enumerator` port. Converged shape: `HashWithIndifferentAccess#select()`/`#reject()` with no block return an Enumerator and the tests `assert_instance_of Enumerator`.
- `inheriting from hash with indifferent access properly dumps ivars` (`:890-902`): asserts `to_yaml` output includes `hash-with-ivars` and `@foo: bar`. Trails has no YAML emitter for HWIA. Converged shape: port HWIA's YAML dump and mirror both `assert_includes`.

## Acceptance criteria

- The three tests carry Rails' assertions; `hash_with_indifferent_access_test.rb` reports 0 assertion mismatches.
