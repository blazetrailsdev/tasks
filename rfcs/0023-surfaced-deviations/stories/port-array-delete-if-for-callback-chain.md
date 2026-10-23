---
title: "Port Array#delete_if and use it in CallbackChain#removeDuplicates/#remove"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages:
  - "activesupport"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Refinement (2026-10-22)

Re-verified against trails `origin/main` when 0023 was retired. CallbackChain#removeDuplicates/remove (callbacks.ts:837,843) still reassign a filtered copy; ruby-compat has a Hash deleteIf but no Array one. Where this note and the original text below disagree, the note is current; the acceptance criteria apply to what remains.

## Context

Surfaced by PR #6377, which added Rails' `remove_duplicates` to
`CallbackChain`. Rails spells it
`@chain.delete_if { |c| callback.duplicates?(c) }`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:658-662`) —
Ruby's `Array#delete_if`, an in-place removal.

trails has no port of `Array#delete_if`
(`packages/activesupport/src/core-ext/array/` has access / conversions /
extract-options / extract / grouping / wrap, none of them this), so both
`CallbackChain#removeDuplicates` and the pre-existing `CallbackChain#remove`
(`packages/activesupport/src/callbacks.ts`) spell it
`this.chain = this.chain.filter(...)`. That cost a `call-mismatches-exclude`
row: `activesupport/callbacks.json`, `remove_duplicates` -> `delete_if`.

## Acceptance criteria

1. `Array#delete_if` is ported under `core-ext/array/`, matching Ruby's
   in-place semantics (mutates and returns the receiver) and its `reject!`
   sibling's contract where they differ.
2. `CallbackChain#removeDuplicates` and `CallbackChain#remove` call it instead
   of reassigning a `filter` result.
3. The `activesupport/callbacks.json` `remove_duplicates` -> `delete_if` row is
   deleted (only-shrink, no `--write`).
4. `pnpm parity:api:calls` green, row count strictly decreases.
