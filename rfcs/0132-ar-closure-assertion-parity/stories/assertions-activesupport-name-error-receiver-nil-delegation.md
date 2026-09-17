---
title: "assertions-activesupport-name-error-receiver-nil-delegation"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
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

Remainder of `assertions-activesupport-module-class-remainder` (RFC 0132) that needs
implementation work rather than test convergence:

- `core_ext/name_error_test.rb` asserts `exc.receiver` in both tests
  (`vendor/rails/activesupport/test/core_ext/name_error_test.rb:13,21`). Ruby core
  `NameError#receiver` has no counterpart on `packages/ruby-compat/src/name-error.ts`,
  and `constantize` (`packages/activesupport/src/inflector.ts`) does not record the
  receiver it resolved against.
- `core_ext/module_test.rb` `delegation to method that exists on nil` (and `... when
allowing nil`) expect `nil.to_f == 0.0` (`module_test.rb:340-348`): Rails'
  `Delegation.generate` (`active_support/delegation.rb:131-147`) calls the method on a
  nil target when `nil.respond_to?(method)`. `packages/activesupport/src/delegation.ts`
  raises `DelegationError` / returns `undefined` because there is no NilClass method
  table in ruby-compat.
- Permanent (not in scope): `delegation line number` / `delegate line with nil`
  (`source_location`), the `private delegate*` `assert_not_respond_to` arms (CLAUDE.md
  § "Method visibility is not a runtime fact in JS"), and the `-1` arities in
  `delegation arity to self class`.

## Acceptance criteria

- `NameError#receiver` ported onto ruby-compat's `NameError` and set by `constantize`;
  `name_error_test.rb` reports 0 mismatches.
- Delegation to a nil target honours `nil.respond_to?(method)` for the NilClass methods
  Rails' tests reach (`to_f`), and the two `module_test.rb` tests assert `0.0`.
- `assertion-mismatch-mark.json` activesupport row lowered by exactly this story.
