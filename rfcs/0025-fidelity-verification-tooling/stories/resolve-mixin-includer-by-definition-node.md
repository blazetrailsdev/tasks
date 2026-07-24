---
title: "test:compare — resolve Ruby mixin includers by definition node, not constant name"
status: draft
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4967 added scope-aware helper resolution to both test:compare extractors.
Two review rounds each found a bug in the SAME mechanism — the Ruby side's
mixin lookup, which matches a module to its including class by NAME:

- `extract-ruby-tests.rb` `collect_module_includers` keys `@module_includers`
  by the constant as written at the `include` site.
- `lookup_scopes` looks that key up from the module's DEFINITION scope path.

Those two spellings diverge whenever a module's name at definition differs from
its name at include:

1. Nested module defined as `["SharedTests", "WithRoutingSharedTests"]` but
   included as the qualified `SharedTests::WithRoutingSharedTests`
   (`vendor/rails/actionpack/test/dispatch/routing_assertions_test.rb:282`,
   `:315`). Patched in #4967 by trying `scope.join("::")` then `scope.last`.

Both fixes are string-matching patches over the same weak primitive. Remaining
known-unhandled spellings include a module reopened under a different nesting,
`include ::Foo::Bar` (top_const_ref), and an include whose constant is resolved
through an enclosing scope but written partially qualified.

The right primitive is to resolve the include against the module's DEFINITION
NODE (the sexp collected in `collect_helper_defs` / `collect_module_includers`)
rather than its rendered name — i.e. resolve the constant path to a definition
the way Ruby constant lookup does, instead of comparing strings.

This path is invisible to `test:compare` totals: every #4967 fix left the
corpus output byte-identical (`14473/21663`, `2018 assertion-count-mismatch`),
because the affected tests have no TS counterpart being compared. Bugs here
surface only under targeted review, which is why two rounds were needed.

## Acceptance criteria

- Ruby mixin helper resolution matches a module to its includer by resolving
  the include's constant path to the module's definition, not by string-keying
  the rendered constant name.
- Handles at minimum: bare include from the enclosing scope, fully-qualified
  include, `::`-rooted include, and a module included from a nesting level
  between definition and include.
- Existing #4967 tests keep passing, including
  "prefers the including class's override over a mixin module's own helper" and
  "finds the includer of a nested module included by qualified constant".
- Add extractor unit tests for each newly handled spelling, each demonstrated
  to fail before the change.
- `pnpm test:compare` totals unchanged (report-only; no CI gate).
