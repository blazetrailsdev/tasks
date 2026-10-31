---
title: "constantize walks TopLevel namespaces"
status: claimed
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["activesupport", "ruby-compat", "activerecord"]
deps: ["top-level-moves-to-ruby-compat"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-30T23:40:52Z"
assignee: "constantize-restored-over-namespaces"
blocked-by: null
closed-reason: null
---

## Context

`constantize` (`packages/activesupport/src/inflector.ts:194`) reads a full-path table, then a receiver property, then `generatedClass`. RFC 0213 § "`constantize`, `safe_constantize`, `const_get` restored". `compute_type` is `vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:255-261`.

## Acceptance criteria

- `constantize` walks `TopLevel` by segment and calls `constMissing` on a miss.
- Literal arguments are typed through `ConstantTable`.
- `rbFLoad` seats onto `TopLevel`.
- The three reflection tests run and pass.
- A test covers a HABTM join model under its qualified name (from trails#9466).
- Root CLAUDE.md § "Constant lookup is an import or a registry", § "Call-time constant resolution" and the `rbFLoad` pointer are rewritten.
