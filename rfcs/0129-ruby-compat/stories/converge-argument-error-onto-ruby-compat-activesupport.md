---
title: "activesupport's 14 hand-rolled ArgumentError classes converge onto ruby-compat's"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 180
priority: 42
pr: 7330
claim: "2026-09-01T12:03:02Z"
assignee: "converge-argument-error-onto-ruby-compat-activesupport"
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat` already owns Ruby's core `ArgumentError`
(`packages/ruby-compat/src/argument-error.ts:10`, cited to
`vendor/ruby/error.c:3323` `rb_eArgError`, exported from
`packages/ruby-compat/src/index.ts:1`). It is also hand-rolled **25 times**
across the tree — the exact `KeyError` pattern RFC 0129 Motivation §1 already
inventoried, at three times the size, and the largest single duplicate
population this audit found.

**14 of the 25 declarations are in `activesupport`**, and this story converges
those (the other 11 are `converge-argument-error-remaining-packages`):

- `activesupport/src/hash-utils.ts:18` (exported, `@internal`, "Mirrors Ruby's
  `ArgumentError`")
- `activesupport/src/messages/serializer-with-fallback.ts:52` (exported)
- `activesupport/src/cache/store.ts:142` (exported)
- `activesupport/src/error-reporter.ts:8`
- `activesupport/src/logger.ts:16`
- `activesupport/src/current-attributes.ts:25`
- `activesupport/src/notifications/fanout.ts:46`
- `activesupport/src/number-helper/rounding-helper.ts:5`
- `activesupport/src/delegation.ts:10`
- `activesupport/src/environment-inquirer.ts:5`
- `activesupport/src/file-update-checker.ts:3`
- `activesupport/src/include.ts:227`
- `activesupport/src/security-utils.ts:3`
- `activesupport/src/notifications/instrumenter.ts:6`

Every body is the same three lines (`class ArgumentError extends Error` with
`name = "ArgumentError"`), i.e. byte-equivalent to the ruby-compat copy modulo
whether `name` is set in the field initialiser or the constructor. Note two of
them are **exported**, so the shim question is real: `hash-utils.ts`'s and
`cache/store.ts`'s are part of `@blazetrails/activesupport`'s public surface.

There are additionally **26 `err.name = "ArgumentError"` assignment sites**
across `packages/*/src` (`grep -rn 'name = "ArgumentError"' packages/*/src
--include=*.ts | grep -v '\.test\.'`, which includes the 25 class bodies —
subtract them for the ad-hoc count). Those are assignments, not declarations,
so `no-ruby-compat-reimplementation-lint` will not see them; they are the same
debt in the shape RFC 0129's Verification table already tracks for `KeyError`
("Ad-hoc `err.name = "KeyError"` sites … 7 → 0").

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed: Rails raises `ArgumentError`
   and never declares it. `parity:api:extra --package activesupport` scores
   `hash-utils.ts`'s `ArgumentError` as _moved_, i.e. matched only by name
   appearing in some other `.rb` — not by a Rails class definition.
2. **MRI counterpart.** `vendor/ruby/error.c:3323`
   (`rb_eArgError = rb_define_class("ArgumentError", rb_eStandardError)`) —
   already the citation ruby-compat's copy carries.
3. **trails calls it.** 14 declaration sites in activesupport alone, each with
   its own local raise sites.
4. **No workspace dependency dragged.** None: `ruby-compat/src/argument-error.ts`
   already exists and imports nothing. This story only deletes copies and adds
   `import { ArgumentError } from "@blazetrails/ruby-compat"`.

Workspace imports of the moved code: none — nothing moves; 14 local classes are
deleted and replaced by one import each.

## Acceptance criteria

- All 14 `class ArgumentError` declarations under `packages/activesupport/src`
  are deleted; each file imports `ArgumentError` from `@blazetrails/ruby-compat`
  instead.
- `grep -rn "class ArgumentError" packages/activesupport/src --include=*.ts |
grep -v "\.test\."` returns **0**.
- `activesupport`'s public surface is unchanged: `hash-utils.ts` and
  `cache/store.ts` keep exporting the name (a re-export of the ruby-compat
  class), so every existing importer and every `err instanceof ArgumentError` /
  `err.name === "ArgumentError"` site keeps working. Those re-exports are
  covered by `delete-ruby-compat-reexport-shims`' per-export decision.
- No member is added to `ruby-compat` — the class is already there — so
  `parity:api:extra:gate` needs **no mark change** for ruby-compat. The
  activesupport extra-surface count can only fall.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
- `packages/ruby-compat` still has no `dependencies` block.
- The `err.name = "ArgumentError"` ad-hoc sites are explicitly **out of scope**
  here and are named in the PR body so they are not silently taken as done.
