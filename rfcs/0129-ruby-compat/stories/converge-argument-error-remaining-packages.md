---
title: "The last 10 ArgumentError declarations outside activesupport converge onto ruby-compat's"
status: claimed
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "actionpack", "actionview", "activemodel", "activerecord", "rack", "i18n"]
deps: ["converge-argument-error-onto-ruby-compat-activesupport"]
deps-rfc: []
est-loc: 160
priority: 43
pr: null
claim: "2026-09-01T14:06:30Z"
assignee: "converge-argument-error-remaining-packages"
blocked-by: null
closed-reason: null
---

## Context

The second half of the `ArgumentError` convergence.
`converge-argument-error-onto-ruby-compat-activesupport` deletes the 14 copies
in `activesupport`; this story deletes the remaining **10 declarations in 6
other packages**, so that
`grep -rn "class ArgumentError" packages/*/src --include=*.ts | grep -v
"\.test\."` reaches **1** (the canonical
`packages/ruby-compat/src/argument-error.ts:10`) from 25 today.

The sites, verified 2026-08-31:

- `actionpack/src/action-dispatch/http/mime-negotiation.ts:28`
- `actionpack/src/action-dispatch/http/permissions-policy.ts:167`
- `actionview/src/helpers/tag-helper.ts:120`
- `activemodel/src/attribute-assignment.ts:149` (extends `globalThis.Error`)
- `activerecord/src/signed-id.ts:7`
- `globalid/src/verifier.ts:3`
- `globalid/src/locator.ts:13`
- `i18n/src/exceptions.ts:114` (**exported**, and a real Rails/i18n concern —
  see the caveat below)
- `rack/src/utils.ts:133` (**exported**)
- `rack/src/query-parser.ts:8`

**Caveat on `i18n/src/exceptions.ts:114`.** `I18n::ArgumentError` is not
plainly Ruby core here: the i18n gem's `exceptions.rb` defines its own
exception family. Check `vendor/` for whether the gem declares
`I18n::ArgumentError` before deleting that one — if the gem declares it, it is
gem surface with an anchor and it **stays**, exactly as README §1's first test
requires. State the answer in the PR body either way.

Four-part test (README §1, §2, §4):

1. **No `vendor/rails/` counterpart** — Rails raises `ArgumentError` and never
   declares it (`i18n` excepted, see caveat).
2. **MRI counterpart** — `vendor/ruby/error.c:3323`, `rb_eArgError`; already
   the citation on ruby-compat's copy.
3. **trails calls it** — 10 declarations, each with local raise sites.
4. **No workspace dependency dragged** — nothing moves. `ruby-compat` already
   owns the class and imports nothing; each site gains one import.

Two of the ten are exported (`rack/src/utils.ts`, `i18n/src/exceptions.ts`), so
those keep exporting the name as a re-export rather than narrowing a package's
public surface.

## Acceptance criteria

- `grep -rn "class ArgumentError" packages/*/src --include=*.ts | grep -v
"\.test\."` returns exactly **1** — `ruby-compat/src/argument-error.ts` —
  or exactly 2 with a stated, evidence-backed reason for keeping
  `i18n`'s gem-anchored one.
- Every deleted site imports `ArgumentError` from `@blazetrails/ruby-compat`;
  no package's public surface loses the name.
- Each affected package's build has `@blazetrails/ruby-compat` as a dependency;
  `packages/ruby-compat` still has no `dependencies` block of its own.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:api:extra:gate` needs no mark
  raise (no ruby-compat member is added).
- The `err.name = "ArgumentError"` ad-hoc assignment sites are out of scope and
  named in the PR body.
