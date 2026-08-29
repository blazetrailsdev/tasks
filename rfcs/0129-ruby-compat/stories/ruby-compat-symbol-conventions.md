---
title: "One Symbol implementation for the colon-prefixed convention, replacing five private isSymbol copies"
status: draft
updated: 2026-08-29
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "i18n", "activemodel"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md fixes the representation — _"A Ruby Symbol is a JS string, never a JS
`Symbol`… keep the Symbol's leading colon in the string: `":short"`, and
`.slice(1)` for its name. The colon is the discriminator Ruby gets from the type,
and it is how the value already renders through `inspect`."_

Nothing implements it once. Five private copies:

- `packages/i18n/src/backend/base.ts:241` (`isSymbol`, with `:248`'s
  `isSymbol(subject) ? subject.slice(1) : String(subject)`)
- `packages/i18n/src/backend/fallbacks.ts:31`
- `packages/i18n/src/backend/simple.ts:43`
- `packages/i18n/src/backend/key-value.ts:64`
- `packages/activemodel/src/validations/numericality.ts:179` — a fifth, with a
  different shape and return type, which is the reason this is a convergence and
  not just a de-duplication

Consumers that read the discriminator or strip the colon (context for what the
export must support): `i18n/src/backend/base.ts:11,425-427`,
`i18n/src/config.ts:21`, `i18n/src/exceptions.ts:101`,
`activesupport/src/xml-mini.ts:445` (`value.startsWith(":") ? "symbol" : …`),
`activesupport/src/core-ext/object/inspect.ts:28`,
`activesupport/src/core-ext/tse/util.ts:191`, `activesupport/src/logger.ts:182`,
`activesupport/src/callbacks.ts:357`, `activesupport/src/cache/store.ts:933`,
`activesupport/src/deprecation.ts:103,334`.

Scope is the convention's own predicate and accessor — "is this value a Symbol"
and "what is its name" — not a Symbol _class_. Per the standing rule, the export
list is exactly what those call sites need. Reconcile the five shapes first;
where they differ, the i18n four (identical) are the reference and
`numericality.ts:179`'s divergence needs a stated reason or converges.

Anchor: `vendor/ruby/symbol.c`, and MRI's own `Symbol#to_s` / `#inspect`
(`rb_sym2str`, `rb_sym_inspect`) are what the colon rendering mirrors.

## Acceptance criteria

- One implementation under `packages/ruby-compat/src/`, with a
  `vendor/ruby/symbol.c:LINE` citation and a `@noRailsEquivalent PERMANENT`
  receipt.
- All five private copies deleted; every call site imports the shared export.
- `numericality.ts:179`'s divergent shape either converges onto the shared one or
  the PR body states, with the call site, why it cannot — and files the
  difference as a follow-on story rather than leaving a second copy.
- Behaviour unchanged at every call site listed above; the i18n backend suites
  and the numericality validation suite are green.
- `packages/ruby-compat/README.md`'s member list names the call sites that
  justify each export (the standing rule).
- `pnpm parity:api`, `parity:api:calls`, `parity:api:extra` show no new rows.
