---
title: "prepend-has-no-prepended-hook"
status: draft
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
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

`rb_mod_prepend` (`vendor/ruby/eval.c:1196-1219`) fires `id_prepended` on the
module after `prepend_features`, unconditionally and once per call — the exact
twin of `rb_mod_include`'s `id_included` (`vendor/ruby/eval.c:1156-1160`).

`prepend()` in `packages/ruby-compat/src/include.ts` has no counterpart at all:
there is no `prepended` symbol beside the exported `included` /`extended` keys,
and `prepend()` never looks for one. A module that wants a class-level hook when
it is prepended has nowhere to put it.

PR #7584 gave `prepend()` the already-present skip and the per-instance
`initialize` half, and made `include()` fire `included` even on the skip path.
It deliberately left the missing hook alone as out of scope; a reviewer named it
there.

## Converged shape

A `prepended` symbol key exported beside `included` and `extended`, fired by
`prepend()` on the module after the members are spliced — and fired on the
already-present skip path too, the way `included` now is, since
`rb_mod_prepend` calls it regardless of what `do_include_modules_at` did
internally.

## Acceptance criteria

- `prepend()` fires a module's `[prepended]` hook with the class, after its
  members are on the prototype.
- The hook fires on a re-prepend, where the splice itself is skipped.
- Tests in `packages/ruby-compat/src/include.test.ts` cover both.
