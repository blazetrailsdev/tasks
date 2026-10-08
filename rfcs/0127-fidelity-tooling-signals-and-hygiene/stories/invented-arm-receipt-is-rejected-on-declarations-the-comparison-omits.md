---
title: "An @inventedArm receipt is rejected on declarations the comparison omits"
status: draft
updated: 2026-10-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
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

`_impliedLayoutName` (`packages/actionview/src/layouts.ts:139`) returns
`dasherize(this.controllerPath())` since trails#8678, where Rails returns
`controller_path` (`actionview/lib/action_view/layouts.rb:345-347`). That is an
invented call and should carry `@inventedArm dasherize — PERMANENT`, as the
sibling `ViewPaths::ClassMethods#localPrefixes` does.

It cannot. The comparison writes no skeleton row for this declaration, so the
tag lands in `uncomparedArmTags` (`scripts/api-compare/compare.ts:6608`,
`uncomparedCallTags`) and `scripts/api-compare/lint-arm-throws.ts:75-89` fails
it as stale:

    - actionview/layouts.ts _impliedLayoutName: dasherize (declaration not compared)

`localPrefixes` is a `static` method on a class and is compared;
`_impliedLayoutName` is a module-level `export function` with a `this:`
parameter that `layouts.ts` installs as a class method. That difference is the
likely reason, not yet confirmed. The same result was seen in trails#8670 for
`Tse::Generators::ScaffoldGenerator#createRootFolder` / `#copyViewFiles`.

The effect is that a deviation from Rails in such a declaration can be neither
measured nor receipted; trails#8678 records it in `CLAUDE.md` prose instead.

## Acceptance criteria

- Find why no skeleton row is written for `_impliedLayoutName` against
  `_implied_layout_name` and state it in the PR.
- Either the pair is compared, and `_impliedLayoutName` then carries
  `@inventedArm dasherize — PERMANENT` with the `CLAUDE.md` sentence saying it
  has no receipt removed; or the gate's message for an uncompared declaration
  says why it is uncompared and what to record instead.
- The two scaffold generator methods from trails#8670 are checked under the
  same finding.
