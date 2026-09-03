---
title: "Kernel#Integer moves to ruby-compat beside Kernel#Float, collapsing four file-local copies and three disagreeing FloatDomainErrors"
status: claimed
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord", "date"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-09-03T10:50:46Z"
assignee: "port-adapter-statement-pool-and-transaction-seats"
blocked-by: null
closed-reason: null
---

## Context

`Kernel#Float` already has a shared home — `packages/ruby-compat/src/kernel-float.ts`,
landed by #7314 under this RFC, carrying a `@noRailsEquivalent PERMANENT` receipt
because Rails calls `Float()` without defining it, so no gem file declares the
module the export would live in. **Its Integer twin was never moved**, and in the
meantime the repo has grown FOUR mutually-inconsistent file-local copies:

| copy                                                                                                                                      | grammar                                                                                | `Integer(Float::NAN)`                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| `activesupport/src/cache/store.ts:50-77` (`Integer`)                                                                                      | full: sign, `_` separators, `0x`/`0b`/`0o`/`0d` + bare-`0` octal                       | `FloatDomainError extends Error`      |
| `activesupport/src/cache/integer.ts:7-12` (`Integer`)                                                                                     | numeric domain only — no String arm at all                                             | **`ArgumentError`**                   |
| `activerecord/src/connection-adapters/abstract/database-statements.ts:670-709` (`integerFromString`, `rubyClassName`, `FloatDomainError`) | full, same grammar as `cache/store.ts`                                                 | `FloatDomainError extends RangeError` |
| `date/src/time.ts:290-295` (`obj2vint`)                                                                                                   | decimal only — `rb_str_to_inum(str, 10, TRUE)`, which is genuinely what `time.c` calls | n/a (truncates)                       |

Three of the four are the same grammar written three times. The three
`FloatDomainError` declarations disagree with each other and two disagree with
MRI — verified on ruby 3.3.11:

```console
$ ruby -e 'p FloatDomainError.ancestors[0,4]'
[FloatDomainError, RangeError, StandardError, Exception]
$ ruby -e 'begin; Integer(Float::NAN); rescue=>e; p e.class, e.message; end'
FloatDomainError
"NaN"
```

So `cache/store.ts`'s `extends Error` is wrong (`FloatDomainError < RangeError`),
and `cache/integer.ts` raises the wrong class outright. `date/src/date.ts:802-807`
already documents the correct `RangeError` ancestry in an `@internal` JSDoc —
a fifth statement of the same fact.

MRI's actual seat: `rb_f_integer` (`vendor/ruby/object.c:3355`) →
`rb_convert_to_integer` (`object.c:3257`), whose String arm is
`rb_str_to_inum(str, base, TRUE)` (`bignum.c:4302`) → `rb_cstr_to_inum`
(`bignum.c:4045`). `obj2vint`'s decimal-only arm is NOT a divergence — `time.c`
really does pass base 10 — so it stays a distinct, correctly-cited helper and is
listed here only so the audit is complete.

## Converged shape

Add `packages/ruby-compat/src/kernel-integer.ts` beside `kernel-float.ts`,
exporting `kernelInteger(val: unknown, base?: number): number` as the port of
`rb_convert_to_integer`, with the same `@noRailsEquivalent PERMANENT` receipt
shape `kernelFloat` carries and the same MRI-citation discipline (cite
`object.c:3257` / `bignum.c:4045` by symbol, not by prose).

`FloatDomainError` moves to `ruby-compat` too, `extends RangeError`, as the one
declaration — the three local ones are deleted and `date.ts:802-807`'s JSDoc
note points at it instead of restating the ancestry.

Then delete the copies and route the call sites:

- `cache/store.ts` and `cache/integer.ts` both call `kernelInteger`;
  `cache/integer.ts` disappears entirely (its only export IS the copy).
- `database-statements.ts` loses `integerFromString` / `rubyClassName` /
  `FloatDomainError`, and `sanitizeLimit`'s else-arm becomes the one-line
  `kernelInteger(limit)` its Ruby counterpart is
  (`database_statements.rb:512`). This is the whole of
  `fold-sanitize-limit-integer-port-into-shared-kernel-integer` (0119), whose
  dep now points here.
- `date/src/time.ts`'s `obj2vint` keeps its base-10 arm but takes it from
  `kernelInteger(obj, 10)` rather than a hand-rolled regex.

`database-statements.test.ts`'s 37 MRI-differential cases (`Integer("012") # => 10`,
`Integer("0x1f") # => 31`, `Integer("1_000") # => 1000`, `Integer("0_1") # => 1`,
raising for `"1__0"` / `"08"` / `"0b2"` / `"1e3"`) carry over to
`kernel-integer.trails.test.ts` rather than being dropped — they are the only
differential coverage the grammar has.

`cache/store.ts`'s file-local `Float()` is the Float-side twin of this and is
owned by [[consolidate-kernel-integer-and-float-conversions]], now in this RFC.
If both land in one PR, delete `inspect()` / `rubyClassName()` there; if not,
whichever goes second removes them.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/kernel-integer.ts` exports `kernelInteger`, is
      re-exported from `index.ts` beside `kernelFloat`, and carries the
      `@noRailsEquivalent PERMANENT` receipt in the shape `kernel-float.ts` uses.
- [ ] Exactly one `FloatDomainError` declaration exists in the repo, in
      ruby-compat, extending `RangeError`; `grep -rn "class FloatDomainError"
packages/*/src` returns one hit.
- [ ] `packages/activesupport/src/cache/integer.ts` is deleted.
- [ ] `grep -rn "invalid value for Integer()" packages/*/src` returns hits only
      from ruby-compat.
- [ ] The 37 MRI-verified cases run against `kernelInteger`.
- [ ] `pnpm parity:api:extra:gate` stays green — ruby-compat is pinned at
      `novel: 0`, so the new export needs its receipt to score `Allowed`.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
