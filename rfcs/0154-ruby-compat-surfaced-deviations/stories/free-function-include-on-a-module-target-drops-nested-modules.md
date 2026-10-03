---
title: "ruby-compat: include(m1, m2) on a Module target does not carry m2 to m1's includers"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while adding the nested-module test for `rbObjIsKindOf` in trails PR 8456
(`packages/ruby-compat/src/object.trails.test.ts`, "answers for a module included by an included
module"). With `const m1 = new Module(), m2 = new Module(); class K {}`:

- `m1.include(m2); include(K, m1)` makes `rbObjIsKindOf(new K(), m2)` true.
- `include(m1, m2); include(K, m1)` makes it false.

`Module#include` (`packages/ruby-compat/src/include.ts`, the `include(mod)` method) records the
nested module in `nestedModules`, which `Module#appendFeatures` replays onto the includer. The
free function `include(target, mod)` given a `Module` as target was not traced in that PR; it
evidently does not reach the same registration. In Ruby both are one call, `rb_mod_include`
(`vendor/ruby/v3.3.11/eval.c:1159-1160`), and `K.ancestors` contains `M2` either way.

## Converged shape

`include(m1, m2)` with a `Module` target dispatches to `m1.include(m2)`, so the nested module
reaches every later includer's ancestry.

## Acceptance criteria

- [ ] `include(m1, m2); include(K, m1)` gives `rbObjIsKindOf(new K(), m2) === true` and
      `rbModAncestors(K)` containing `m2`.
- [ ] A trails test in `packages/ruby-compat/src` covers both spellings.
