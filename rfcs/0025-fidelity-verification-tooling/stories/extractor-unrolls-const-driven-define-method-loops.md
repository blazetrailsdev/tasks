---
title: "Unroll CONST.each define_method loops in the Ruby extractor"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5435 taught `scripts/api-compare/extract-ruby-api.rb` to unroll a
`.each` loop that metaprograms methods, but **only when the receiver is a fully
literal array** (`[:before, :after, :around]`, `%w(reverse tidy_bytes)`) — see
`process_each_metaprogramming` and `literal_array_members`. A receiver that is a
constant is deliberately rejected, so those loops emit nothing.

That was a scope decision, not a limitation of the surrounding machinery:
`resolve_const_symbol_array` already resolves a symbol-array constant to its
members across files, and `process_each_codegen` already uses it — but only for
the `class_eval "def #{name}…"` template shape (RFC 0025's
`extractor-capture-enumerable-metaprogrammed-surface`, PR #3991). The
`CONST.each { define_method … }` combination falls between the two recorders.

Real instances in the vendored tree, found by scanning for a non-literal `.each`
receiver with a `define_method` in the block body:

- `vendor/rails/activerecord/lib/active_record/encryption/properties.rb:32` —
  `DEFAULT_PROPERTIES.each` generating `define_method name` and
  `define_method "#{name}="` (a symbol-array constant; the directly analogous
  case).
- `vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb:189`
  and `.../permissions_policy.rb:122` — `DIRECTIVES.each do |name, directive|`.
  These iterate a **hash** constant, so they need key extraction rather than
  `resolve_const_symbol_array`; treat as a separate, larger arm and split it out
  if it does not fit.

Loops whose receiver is a local (`types.each`, `keys.each`, `method_names.each`
in `delegated_type.rb:258`, `store.rb:135`, `method_wrappers.rb:41`) are
runtime-only codegen inside a `def` body and must stay unrecorded — `process_def`
never descends into method bodies, and attributing them to the enclosing module
would be wrong.

## Acceptance criteria

- `process_each_metaprogramming` accepts a symbol-array-constant receiver,
  resolving members via `resolve_const_symbol_array` (including the cross-file
  case), in addition to today's literal arrays.
- `Encryption::Properties`' generated readers and writers appear in
  `rails-api.json`.
- The guard arm is preserved and tested: a constant that does not resolve to a
  pure symbol array is skipped, not guessed, exactly as a non-literal array
  element is today.
- Hash-constant receivers (`DIRECTIVES.each do |name, directive|`) are either
  handled or explicitly deferred to a follow-up story with a comment saying so.
- Extractor tests cover both the resolving and non-resolving arms, driven
  through the real Ripper parser like the rest of `extract-ruby-api.test.ts`.
- Record the before/after `rails-api.json` delta in the PR body, as #5435 did
  (19 added / 0 removed), so the new surface is auditable.
