---
title: "Lint JSON.stringify, String() and constructor.name inside error messages and inspect bodies"
status: done
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: "lints"
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#7979
claim: "2026-09-22T18:19:58Z"
assignee: "lint-instanceof-guard-where-rails-asks-respond-to"
blocked-by: null
closed-reason: null
---

## Context

Rails renders values into messages with `inspect`, `.class` and `.class.name`. Ports keep reaching for the JS reflex, and 0155 has nine instances of one pattern:

- `JSON.stringify(x)` for `x.inspect`: `deferrable-error-message-symbol-inspect`, `deferrable-error-message-use-inspect` (`connection-adapters/postgresql/schema-statements.ts:678`), `sqlite-pragma-error-parity`.
- `x.constructor?.name` for `x.class` / `x.class.name`: `quote-error-message-uses-js-constructor-name` (`connection-adapters/abstract/quoting.ts:100`), `serialization-type-mismatch-message-class-and-inspect` (`coders/column-serializer.ts:61-69`), `attribute-assignment-argument-error-names-js-number-not-integer`, `hash-config-inspect-omits-ruby-class-path`, `ar-base-abstract-class-message-lacks-module-path`.
- `String(x)` for `x.to_s` on an Array, where Ruby's `Array#to_s` is `inspect`: `uuid-cast-array-stringification` (`connection-adapters/postgresql/oid/uuid.ts:28`).

The backlog has at least three more hand-filed point stories for the same pattern (`check-constraint-raise-message-uses-json-stringify-not-ruby-hash-inspect`, `paths-and-attribute-set-inspect-messages-use-json-stringify`, `batches-order-inspect-hand-rolls-symbol-rendering`) and no lint.

## Acceptance criteria

- A `blazetrails/` ESLint rule flags `JSON.stringify(`, `String(` and `.constructor.name` / `.constructor?.name` when they appear inside a template literal or argument of a `throw new`, or inside a method named `inspect` / the `nodejs.util.inspect.custom` symbol.
- Scoped to Rails-matched source files. Test files and JSON-producing code are not flagged.
- Ships behind a per-package enrollment list that is only-grow, like `unbacked-internal-needs-receipt`. The first enrolled package is clean at merge.
- The nine 0155 sites above are each flagged, or the PR body says why one is not.
- Not autofixable. The message names ruby-compat's inspect and class-path helpers.
