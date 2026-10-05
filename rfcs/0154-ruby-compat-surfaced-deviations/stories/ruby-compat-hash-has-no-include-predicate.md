---
title: "Hash#include? has no ruby-compat spelling; Thor's script fixture calls Map#has"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MyScript#baz` (`vendor/thor/v1.3.2/spec/fixtures/script.thor:66-68`) is
`raise if thing.nil? && !options.include?(:all)`. `options` is a
`Thor::CoreExt::HashWithIndifferentAccess`, which overrides `key?`
(`vendor/thor/v1.3.2/lib/thor/core_ext/hash_with_indifferent_access.rb`) but not `include?`.
`Hash#include?` is its own C binding to `rb_hash_has_key` (`vendor/ruby/v3.3.11/hash.c`) and does
not dispatch to the override, so it looks the key up unconverted.

trails' `Hash` (`packages/ruby-compat/src/hash.ts:929`) has no `isInclude`, and the fixture
(`packages/trailties/src/thor/test-helpers/fixtures/script.ts`, `MyScript#baz`) spells the call
`this.options.has("all")`, a `Map` method with no Ruby name.

## Acceptance criteria

- [ ] `Hash` answers `include?` at its Ruby name (`isInclude`), unconverted as
      `rb_hash_has_key` is, with its MRI citation and receipt.
- [ ] `MyScript#baz` calls it, and `thor_spec.rb`'s `baz` examples pass against the fixture
      once ported.
