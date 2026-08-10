---
title: "port-attribute-methods-bracket-accessors"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6068
claim: "2026-08-04T15:49:36Z"
assignee: "port-attribute-methods-bracket-accessors"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::AttributeMethods#[]` (attribute_methods.rb:415, `read_attribute(attr_name) { |n| missing_attribute(n, caller) }`) and `#[]=` (attribute_methods.rb:428, `write_attribute(attr_name, value)`) have NO counterpart in `packages/activerecord/src/attribute-methods.ts` — the file exports `readAttribute` / `writeAttribute` but nothing standing in for the bracket accessors. The generated per-attribute accessors (attribute-methods.ts:417-433) reproduce the same raise-on-missing behavior, but they are not a port of `[]` itself.

Because there is no TS member, the two operators cannot be pinned in `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`): the table only accepts spellings verified against a real TS member. Discovered while pinning module-level operator spellings (story `module-level-operator-spellings-unpinned`).

## Acceptance criteria

- [ ] Port `[]` / `[]=` to `packages/activerecord/src/attribute-methods.ts` with a spelling consistent with the rest of the table (`get` / `set` is the established pairing for `[]` / `[]=`), preserving the `missing_attribute` raise on read.
- [ ] Wire them onto the record surface the way the surrounding module methods are wired.
- [ ] Add the verified entries to `OPERATOR_SPELLING_BY_FQN` with the `file:line` comment the table uses.
- [ ] `pnpm parity:api` stays green.
