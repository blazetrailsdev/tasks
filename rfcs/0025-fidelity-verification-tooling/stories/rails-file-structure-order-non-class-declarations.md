---
title: "rails-file-structure-method-order orders non-class top-level declarations"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7146 taught `blazetrails/rails-file-structure-method-order` to order
top-level declarations against the Ruby file's source order, but the
`declarations` list the builder emits holds **classes only** — populated in
`visitClasses` at `scripts/build-rails-file-structure-manifest.ts:250` from the
fqn's last segment.

The story's acceptance criteria asked for more: "classes, modules, and
module-level `def`s / constants, in source order", and on the rule side "a
top-level TS declaration (class, exported function, exported const)". Those
arms were left out because the Ruby extract carries no source POSITION for
them relative to the classes:

- Standalone Ruby modules bucket their methods into `functions`
  (`build-rails-file-structure-manifest.ts:279-300`), a flat per-file list with
  no position against the file's classes.
- `fileConstants` is emitted by `extract-ruby-api.rb` but carries no line, so a
  constant cannot be placed between two classes.
- Entities themselves have no `line` field (`normalize_class_info`,
  `extract-ruby-api.rb:3356-3366`); PR #7146 relied on the extractor's
  encounter order, which orders classes against each other but cannot
  interleave a `def` or a constant among them.

Live shape: `vendor/rails/activerecord/lib/arel/nodes/casted.rb` declares
`Casted`, `Quoted`, then the module-level `def self.build_quoted` — trails'
`packages/arel/src/nodes/casted.ts` is free to put `buildQuoted` anywhere and
stays green.

## Acceptance criteria

- The Ruby extractor records a `line` for each class/module entity and for each
  file constant, so a declaration list can interleave classes, module-level
  `def`s, and constants in one source order.
- The builder's `declarations` list carries those non-class declarations under
  the TS name they port to (a module-level `def self.x` → the top-level
  `export function x`).
- The rule orders top-level `export function` / `export const` declarations
  against class declarations, keeping PR #7146's evaluation-order guard
  (`declarationReorderIsSafe`): a `const` is not hoisted, so the guard must
  extend to a const whose initializer names a sibling.
- `pnpm eslint packages/arel/src packages/activemodel/src --max-warnings 0`
  stays green, or the hits it surfaces are converged in the same PR.
