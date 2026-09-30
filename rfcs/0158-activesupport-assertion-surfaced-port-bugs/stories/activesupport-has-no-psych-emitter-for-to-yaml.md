---
title: "activesupport-has-no-psych-emitter-for-to-yaml"
status: ready
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: ["move-activesupport-yaml-into-ruby-compat-psych", "psych-object-to-yaml"]
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

- [ ] Port the `visit_Hash` ivars arm (`!ruby/hash-with-ivars:<Class>`,
      `visit_Hash` → `visit_hash_subclass`, `vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:326-337,425-450`) in
      ruby-compat's `YAMLTree`. The home is decided by RFC 0000-psych-in-ruby-compat,
      and `Object#to_yaml` is `toYaml` from `psych-object-to-yaml`.
- [ ] The parked test runs unskipped with Rails' two `assert_includes` and
      their values; `hash_with_indifferent_access_test.rb` has no count / kind /
      value mismatch left from it.

## Home (RFC 0000-psych-in-ruby-compat)

Psych moves out of `packages/activesupport/src/yaml.ts` into
`packages/ruby-compat/src/psych*.ts` (layout: RFC Design §1) in
`move-activesupport-yaml-into-ruby-compat-psych`. Write this story's code there, as `Psych` namespace
members, and not in activesupport.
