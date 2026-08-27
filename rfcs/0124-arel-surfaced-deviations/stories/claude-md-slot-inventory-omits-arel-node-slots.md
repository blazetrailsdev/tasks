---
title: "CLAUDE.md zero-import-slot inventory omits arel/src/node-slots.ts"
status: claimed
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: followup
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-08-27T16:40:07Z"
assignee: "arel-trails-only-tests-in-rails-named-files"
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md, "Call-time constant resolution (Ruby autoload → the zero-import
slot)", states: "Two instances exist and are the only ones" and lists
`activerecord/src/encryption/configurable-slot.ts` and
`activerecord/src/associations/collection-proxy-slot.ts`.

`packages/arel/src/node-slots.ts` is a third: a zero-import module exporting
nine `_X` / `_setX` slot pairs (`_Not`, `_Grouping`, `_Or`, `_And`,
`_Equality`, `_In`, `_buildQuoted`, `_Attribute`, `_Dot`, `_Table`), read by
`nodes/node.ts:1,29-44`, `arel.ts:15,77`, `nodes/node-expression.ts:2,35`,
`nodes/casted.ts`, `nodes/binary.ts`, `tree-manager.ts`. Its header even cites
the CLAUDE.md section as its justification (node-slots.ts:17-19). The section
is the policing rule for new slots ("do not reach for a slot when a plain
import does not actually close a cycle"), so an inventory that omits the
largest instance in the repo weakens the rule.

## Acceptance criteria

- CLAUDE.md's slot inventory lists `arel/src/node-slots.ts` with the same
  one-line "read by" summary the other two have, and the "only ones" sentence
  is corrected.
- Docs-only change.
