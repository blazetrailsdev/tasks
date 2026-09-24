---
title: "SafeBuffer strRange: mirror rb_str_subpat_set's raises, negative and named groups"
status: draft
updated: 2026-09-24
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
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

## Context

`strRange` in `packages/activesupport/src/core-ext/string/output-safety.ts` computes the target span for SafeBuffer's `slice!` and `[]=`. Its regexp arm is the counterpart of Ruby's `rb_str_subpat_set` (`vendor/ruby/string.c:5418-5449`). trails#8023 ported only one of that function's raises, the `start == -1` arm (`:5439-5441`, `"regexp group %d not matched"`), because TS 7 surfaced it. The rest still diverges:

- **No match at all** (`:5426-5428`): Ruby raises `IndexError, "regexp not matched"`. trails does `new RegExp(...).exec(str)!`, so a null match throws a JS `TypeError` on `match.indices`.
- **Group index out of range** (`:5431-5433`): Ruby raises `IndexError, "index %d out of regexp"` when `nth >= num_regs` or `-nth >= num_regs`. trails reads `match.indices![nth]`, gets `undefined`, and reports it as "regexp group not matched".
- **Negative `nth`** (`:5434-5436`): Ruby normalizes it with `nth += regs->num_regs`. trails indexes the array with a negative number.
- **Named backrefs** (`rb_reg_backref_number`, `:5429`): Ruby accepts a String or Symbol group name. trails' `second` is numeric only.

## Converged shape

Mirror `rb_str_subpat_set`'s guard order in `strRange`'s RegExp arm: raise `IndexError` "regexp not matched" on a null `exec`; resolve `nth` (a name through `match.groups` / `indices.groups`); raise "index %d out of regexp" when it is out of range; normalize a negative `nth`; then raise "regexp group %d not matched" on an unmatched group; then take start/end/len. Use `IndexError` from `@blazetrails/ruby-compat`.

## Acceptance criteria

- [ ] Every `rb_str_subpat_set` raise has a counterpart in `strRange`, in Ruby's order, with Ruby's message.
- [ ] `SafeBuffer#set` / `sliceBang` accept a regexp and a group (number, negative number or name) wherever Rails' `[]=` does, reaching the same raises.
- [ ] Tests cover each raise. Mirror the Rails `safe_buffer_test.rb` / `output_safety_test.rb` names wherever a Rails test exists, and use `.trails.test.ts` for Ruby-core-only arms.
