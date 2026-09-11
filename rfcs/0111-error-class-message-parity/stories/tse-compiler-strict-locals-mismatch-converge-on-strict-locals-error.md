---
title: "tse-compiler-strict-locals-mismatch-converge-on-strict-locals-error"
status: in-progress
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7717
claim: "2026-09-11T19:10:29Z"
assignee: "converge-postgresql-prepare-statement-missing-throw-arm"
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#7711, which ported Rails' strict-locals keyword binding
(`actionview/lib/action_view/base.rb:261-282`, `template.rb:443-538`) and
`ActionView::StrictLocalsError` (`actionview/lib/action_view/template/error.rb:30-39`)
into `packages/actionview/src/template/error.ts`.

A second, divergent implementation remains:

- `packages/actionview/src/strict-locals.ts` `StrictLocalsMismatch` sets
  `name = "ActionView::Template::StrictLocalsError"` and a message shaped
  `unknown local "x" passed to template; allowed: "y"`. Rails' message is
  `unknown local: :x for <short_identifier>`.
- `packages/tse-compiler/src/emit-js.ts:55-110` (`emitLocalsBlock`) emits that check
  into ahead-of-time compiled templates, and imports it from
  `@blazetrails/actionview/strict-locals`.
- `packages/actionview/src/index.ts:89` still exports it.

Rails has one error, raised from the kwargs `ArgumentError` at the `_run` call frame.

## Acceptance criteria

- [ ] tse-compiler's emitted strict-locals check raises the Rails-shaped error (or goes
      through the same keyword binding as `Template#compile`) with Rails' message.
- [ ] `StrictLocalsMismatch` is deleted, together with its export and its `strict-locals` subpath.
