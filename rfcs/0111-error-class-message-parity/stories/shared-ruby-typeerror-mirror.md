---
title: "One ported Ruby TypeError instead of three private mirrors and three suppressions"
status: draft
updated: 2026-08-13
rfc: "0111-error-class-message-parity"
cluster: duplicate-error-classes
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `TypeError` is raised in three trails files, and each one carries its own
private mirror class plus an eslint suppression:

- `packages/activemodel/src/attribute-assignment.ts:257` (`Kernel.Float`)
- `packages/activesupport/src/cache/store.ts:123` (raises at `:49`, `:90`, `:259`)
- `packages/activerecord/src/relation/calculations.ts` (added by PR #6471 for
  `Array#sum`'s non-numeric initial value: `[1].sum("age")` is
  `TypeError: no implicit conversion of Integer into String`, reached through
  `Calculations#sum`'s block arm, `calculations.rb:172-174`)

Each raise site needs `// eslint-disable-next-line blazetrails/rails-error-parity`
because the rule keys on the CONSTRUCTOR NAME (`NATIVE_ERRORS` in
`eslint/rails-error-parity.mjs:41-46`), so `throw new TypeError(…)` is flagged
whether the class is the global one or a faithful Ruby mirror. The rule's own
docs describe the intended escape — "ported subclasses pass" — but that only
works for a class named something other than a native error, which a mirror of
Ruby's `TypeError` cannot be.

The result is one Ruby error class copied three times, three suppressions, and
no single place for `error.name`/hierarchy behavior to be asserted.

## Converged shape

One ported `TypeError` (Ruby core, like the `RuntimeError` mirror next to it in
`attribute-assignment.ts`), exported from a package the other two can import,
and recognised by `rails-error-parity` so no raise site needs a suppression —
the rule should accept a throw whose constructor resolves to the ported class
rather than keying on the bare identifier. Then delete the two duplicate mirrors
and all suppressions of this rule for `TypeError`.

Note the rule change is the substance: without it, moving the class merely moves
the suppressions. Do NOT resolve this by adding rows to
`eslint/rails-error-parity-exclude.json`.

## Acceptance criteria

- [ ] A single ported Ruby `TypeError` exists, with the other two mirrors
      deleted and their raise sites importing it.
- [ ] `rails-error-parity` accepts those raise sites with no
      `eslint-disable` comment and no new baseline row.
- [ ] `[1].sum("age")`-shaped messages and `error.name === "TypeError"` stay
      asserted where they already are (`calculations.trails.test.ts`).

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
