---
title: "Constant redefinition warns 'already initialized constant' (const_tbl_update), used by Tool's setter"
status: draft
updated: 2026-10-27
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

`rb_const_set` on a constant that already exists warns "already initialized constant Foo::Bar" and "previous definition of Bar was here" (`vendor/ruby/v3.3.11/variable.c`, `const_tbl_update`), whenever `$VERBOSE` is not nil. ruby-compat has no such warning.

As a result, the `MiniMagick::Tool::<Name>` setter added by trails#9381 (`packages/mini-magick/src/tool.ts`, the defineProperty `set` in the loop at the end of the file) redefines a constant silently, where Ruby's `const_set` warns.

## Acceptance criteria

- ruby-compat ports the `const_tbl_update` redefinition warning at its MRI name, citing `variable.c:LINE`.
- `Tool`'s setter calls it before it redefines the constant.
- A test asserts the warning text when `Tool.Convert` is reassigned.
