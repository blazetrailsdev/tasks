---
title: "activesupport-has-no-psych-emitter-for-to-yaml"
status: draft
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test_inheriting_from_hash_with_indifferent_access_properly_dumps_ivars`
(`vendor/rails/activesupport/test/hash_with_indifferent_access_test.rb:871-883`)
asserts `klass.new.to_yaml` contains `hash-with-ivars` and `@foo: bar`.
Rails defines no `to_yaml`: it is Psych's `Object#to_yaml` (`Psych.dump`),
whose `YAMLTree#visit_Hash` emits a Hash subclass carrying instance variables
as `!ruby/hash-with-ivars:<Class>` with `elements:` / `ivars:` maps.

trails has no Psych emitter: `packages/activesupport/src/yaml.ts` re-exports
the `yaml` npm package's `stringify`, which knows no Ruby object tags, and
nothing in `packages/*/src` spells `hash-with-ivars`. The parked test is
`packages/activesupport/src/hash-with-indifferent-access.test.ts` ›
`inheriting from hash with indifferent access properly dumps ivars`, still
carrying its pre-convergence body.

Split out of `hwia-has-no-enumerator-form-or-yaml-dump`, whose Enumerator half
landed (ruby-compat `Enumerator` / `toEnum`, HWIA `select` / `reject`
block-less arms).

## Acceptance criteria

- [ ] Decide the home of Psych's `Object#to_yaml` / `YAMLTree` in trails
      (ruby-compat, as Ruby stdlib) and port the `visit_Hash` ivars arm it needs.
- [ ] The parked test runs unskipped with Rails' two `assert_includes` and
      their values; `hash_with_indifferent_access_test.rb` has no count / kind /
      value mismatch left from it.
