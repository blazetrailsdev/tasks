---
title: "KeyValue's superclass is never inheritance-checked (I18n::JSON wins primary)"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6072
claim: "2026-08-04T17:04:59Z"
assignee: "i18n-key-value-inheritance-never-checked"
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::KeyValue`'s superclass is never inheritance-checked, and closing
that exposes two `compare.ts` limitations.

`vendor/i18n/lib/i18n/backend/key_value.rb` declares two classes: `I18n::JSON`
(`:8`) and `I18n::Backend::KeyValue` (`:68`). `primaryClassPerFile`
(`scripts/api-compare/compare.ts:1711-1718`) picks the SHORTEST fqn, so
`I18n::JSON` — two segments — wins over the three-segment `KeyValue`, and the
inheritance loop (`compare.ts:2349`) skips every non-primary class. PR #6063
entered `I18n::JSON` in `RUBY_ONLY_CLASSES` and made the inheritance loop skip
it, which stopped the bogus `ts-class-missing`, but `KeyValue` still gets no
check: the file simply contributes none.

The obvious fix — also skipping ruby-only classes in the `primaryClassPerFile`
loop so `KeyValue` becomes primary — was tried in #6063 and rejected, because it
makes two other things worse:

1. `SubtreeProxy` (`key_value.rb:154`) then reads as a nested class under a
   shorter-named parent and is dropped by the
   "skip nested classes in same file as a shorter-named parent" rule
   (`compare.ts:1721-1727`): 177/184 methods → 176/183.
2. `KeyValue` reports a super-mismatch. Ruby `KeyValue` has no superclass and
   gets `Base` via `include Base, Flatten` (`key_value.rb:70`); trails writes
   that as `class KeyValue extends Base` (`key-value.ts`), the settled idiom
   `Simple` and `Chain` also use. `superclassesMatch` does not model
   Ruby-`include` → TS-`extends`, so a faithful port reads as a mismatch.

## Converged shape

Two independent fixes, either order:

- Teach `superclassesMatch` that a Ruby class whose `include`d modules contain
  the TS superclass is a match, so the `include Base` → `extends Base` idiom
  (`simple.rb`, `chain.rb`, `key_value.rb` all use it) stops reading as drift.
- Make nested-class folding key on the actual lexical parent rather than on
  "shortest fqn in the file", so promoting `KeyValue` to primary cannot swallow
  `SubtreeProxy`'s six methods.

Then skip `RUBY_ONLY_CLASSES` entries in `primaryClassPerFile` selection too, so
`KeyValue` is the class key_value.rb's inheritance check actually looks at.

## Acceptance criteria

- `I18n::Backend::KeyValue` is inheritance-checked and matches.
- i18n `parity:api` matched-method count does not regress from `177/184`, and
  `SubtreeProxy`'s methods stay measured.
- i18n inheritance stays at 100%.
