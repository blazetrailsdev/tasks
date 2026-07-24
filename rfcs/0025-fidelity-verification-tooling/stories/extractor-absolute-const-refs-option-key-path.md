---
title: "api-compare: honour leading :: on the assert_valid_keys const-expansion path"
status: in-progress
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 25
pr: 5223
claim: "2026-07-24T13:53:23Z"
assignee: "extractor-absolute-const-refs-option-key-path"
blocked-by: null
closed-reason: null
---

## Context

PR #4965 taught the Ruby extractor to preserve a leading `::` on mixin and
superclass references so `lookup_ancestor` can honour Ruby's rule that `::`
forces an absolute lookup. It did so via an opt-in `keep_absolute:` keyword on
`traverse_for_consts` (`scripts/api-compare/extract-ruby-api.rb`), passed only
by the four `include`/`extend` call sites and by the `class X < Sup` superclass
capture.

The helper's other caller was deliberately left on the old bare-name behaviour:
the `assert_valid_keys` option-key expansion (around the `traverse_for_consts`
call in `scan_option_keys`) feeds names into a hash keyed by bare constant
names via `resolve_const_symbol_array`, so handing it `::Foo` would miss.
That means `assert_valid_keys ::Foo::VALID_KEYS` still resolves with the
absoluteness dropped — the same latent misresolution #4965 fixed for mixins,
just on the option-key path.

This is latent, not live: vendored Rails has no absolute constant reference on
this path today, exactly as it had none on the mixin path.

The cost of converging is that `resolve_const_symbol_array` matches a container
path against stored FQNs (`fqn == container || fqn.end_with?("::#{container}")`),
so it needs an absolute-container branch that anchors to the top level and skips
the `end_with?` suffix match, rather than just stripping the `::`.

## Acceptance criteria

- The `assert_valid_keys` const-expansion path preserves absoluteness the same
  way the mixin path does (`keep_absolute: true`, or the two callers converge on
  one convention).
- `resolve_const_symbol_array` resolves a `::`-prefixed container against the
  top level only, and does NOT accept a suffix match on a nested FQN.
- Unit coverage in `extract-ruby-api.test.ts` pins `assert_valid_keys
::Foo::KEYS` binding to the top-level `Foo` when a nested `Foo` also exists —
  mirroring the mixin test added in #4965.
- `api:compare` option-key totals unchanged (regression check, not a target):
  the change is inert on vendored Rails.

Note: `:top_const_path_ref` is NOT a Ripper event — `Ripper::PARSER_EVENTS`
defines only `:top_const_ref` and `:top_const_field`. Reuse the existing
`absolute_const_ref?` / `qualified_const_name` helpers rather than writing a new
node-type check.
