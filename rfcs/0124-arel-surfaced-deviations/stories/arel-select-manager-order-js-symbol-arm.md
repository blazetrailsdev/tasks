---
title: "arel: SelectManager#order and visitor dispatch model Ruby Symbol as JS Symbol"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: invented-arm
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md ("A Ruby Symbol is a JS string, never a JS `Symbol`") forbids
modelling a Ruby Symbol value with a JS `Symbol`. Three arel sites do it:

- `packages/arel/src/select-manager.ts:328-338` `order(...exprs)` has a
  `typeof x === "symbol" ? new SqlLiteral(x.description ?? x.toString())` arm.
  Rails (`vendor/rails/activerecord/lib/arel/select_manager.rb:172-178`)
  matches `STRING_OR_SYMBOL_CLASS`, and in trails both classes are `string`,
  so the JS-Symbol arm is invented. The signature `(Node | string | symbol)[]`
  advertises it publicly. (`nodes/window.ts:23-30` handles the identical Rails
  body with the `string` arm only — the correct spelling.)
- `packages/arel/src/visitors/ruby-class.ts:44` and `visitors/dot.ts:580`
  classify a JS `symbol` value as Ruby `Symbol` for dispatch. No trails caller
  ever hands a JS `Symbol` to a visitor; the arm exists only to be spelled.

The `order` parameter is also `exprs` where Rails has `expr`
(select_manager.rb:172, table.rb:58 vs select-manager.ts:328, table.ts:139).

## Acceptance criteria

- `SelectManager#order` and `Table#order` accept `(Node | string)[]`, named
  `expr`, with the string arm only — same shape as `Window#order`.
- `ruby-class.ts` and `dot.ts` drop the JS-`symbol` classification (or, if a
  caller is found that needs it, that caller is cited at the site and the arm is
  moved behind a `@noRailsEquivalent` receipt).
- `select-manager.test.ts`, `table.test.ts`, `visitors/dot.test.ts`,
  `visitors/visitor.test.ts` stay green.
