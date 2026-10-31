---
title: "const-family-ruby-facing-names"
status: draft
updated: 2026-10-31
rfc: "0213-zeitwerk-build-time-autoloader"
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

`constantize` (`packages/activesupport/src/inflector.ts`) is `Object.const_get(camel_cased_word)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/methods.rb:289-291`) and calls ruby-compat's `rbModConstGet`. That call stays: `constantize` is the Rails-facing name. Trails#9518 also spells `rbModConstSet` in `packages/activesupport/src/inflector.trails.test.ts`, and a ported body with a literal `const_get`, `const_set` or `const_defined?` has only the MRI-derived name to call. The repo owner does not want Ruby C names propagating through ported code where a Ruby-facing name can stand in.

This covers the constant family only. The wider `rb*` convention (`rbFSend`, `rbObjDup`, `rbProcCall`) is out of scope.

## Acceptance criteria

- ruby-compat exports `constGet`, `constSet` and `constDefined`, spelled after Ruby's `Module#const_get`, `#const_set` and `#const_defined?`.
- Every call site outside ruby-compat uses those names, except `constantize` and its siblings where the story's review finds the internal call clearer; `rbModConst*` no longer appears in ported bodies or tests otherwise.
- The `rbModConst*` names stop being public ruby-compat exports where nothing outside the package needs them.
- Root CLAUDE.md's references to `rbModConstGet` / `rbModConstSet` as call-site spellings are updated, and the receipts and parity gates stay green.
