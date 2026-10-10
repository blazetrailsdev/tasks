---
title: "Write the native-hash-forms rule into CLAUDE.md, the ruby-compat README and the parity table comments"
status: draft
updated: 2026-10-10
rfc: "0190-native-js-hash-forms"
cluster: gate
packages: [ruby-compat]
deps: [native-hash-forms-credit-key-delete-merge]
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

Substitution leaves two spellings in the repo for weeks. The rule for choosing
between them has to be written where a porter reads it before the first
substitution PR, or new code will keep reaching for the helper (and the
reverse gate's message used to tell it to).

Places that currently say "call the helper":

- trails `CLAUDE.md` § "Ruby idioms that do not translate literally": the
  `fetch` vs `??` bullet is right and stays; there is no bullet on `key?`,
  `delete`, `merge!` or `[]`.
- `packages/ruby-compat/README.md` § "What is here" (`:17`) inventories the
  hash exports with their call sites, and § "1. Only what trails actually
  calls" (`:163`) is the rule the shrink story applies.
- `scripts/parity/ruby-compat.ts:1-31` describes the table as "a body that
  hand-rolls the escape under another name IS flagged, and converges by
  importing the export".
- `docs/ruby-ts-conventions.md` is generated from
  `scripts/parity/conventions.ts`; change the source, never the doc.

## Acceptance criteria

- [ ] `CLAUDE.md` § "Ruby idioms that do not translate literally" gains one
      bullet, **Hash calls on a plain object**, giving the RFC's
      § "Per-name decisions" as a rule: the native form per Ruby call, `in`
      for a literal key and `Object.hasOwn` for a computed one, and the cases
      that keep the helper (a value-using `delete`, a conflict block, a `Map`
      or dispatching receiver, an `undefined`-valued keyword, `fetch` always).
      Written as a rule, with no history: the history goes in
      `docs/claude-md-decision-history.md`.
- [ ] The `fetch` vs `??` bullet is unchanged in substance and cross-references
      the new one.
- [ ] `packages/ruby-compat/README.md` says the hash helpers are for the arms
      JS lacks, and names them.
- [ ] The header comment of `scripts/parity/ruby-compat.ts` says a hash row is
      also satisfied by its marked native form, citing
      `NATIVE_FORM_ANALOGUES`.
- [ ] `pnpm vendor:recite` reports nothing to rewrite, and
      `scripts/vendor-citations.test.ts` passes.

## Notes

Docs-only apart from the two comment edits, so mostly LOC-exempt.
