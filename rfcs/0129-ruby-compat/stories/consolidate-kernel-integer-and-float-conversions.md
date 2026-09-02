---
title: "cache/store.ts's file-local Kernel#Float retires onto ruby-compat's kernelFloat (cache.rb:213-214)"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages:
  - "ruby-compat"
  - "activesupport"
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed under 0023 on 2026-08-13 as "consolidate the ported Kernel#Integer /
Kernel#Float conversions into one home", when trails had neither. Moved here
under 0124's rule — 0134 explicitly lists it as a cross-package sweep that is
`activemodel`-labelled but not `activemodel`-subject, to move to its owning
package. That package is ruby-compat.

**Most of the original scope has since been delivered, and the story is narrowed
to what is left.** For the record, what closed on its own:

- The shared home exists — `packages/ruby-compat/src/kernel-float.ts`, landed by
  #7314 (`kernel-float-raises-like-mri`), with the Ruby literal grammar this
  story specified and a `@noRailsEquivalent PERMANENT` receipt.
- The activemodel call site is converged —
  `validations/numericality.ts:4,167` imports `kernelFloat`, and
  `attribute-assignment.ts:1-6` now takes `TypeError` from ruby-compat rather
  than declaring its own.
- The **Integer** half is `move-kernel-integer-to-ruby-compat`, which owns the
  four remaining file-local `Integer()` copies and the three disagreeing
  `FloatDomainError` declarations. Do not duplicate it here.

What remains is one copy:
`packages/activesupport/src/cache/store.ts:94-110` still declares a file-local
`Float()`, reached from `retrieve_pool_options` at `store.ts:235`:

```ruby
# activesupport/lib/active_support/cache.rb:213-214
pool_options[:size] = Integer(pool_options[:size]) if pool_options.key?(:size)
pool_options[:timeout] = Float(pool_options[:timeout]) if pool_options.key?(:timeout)
```

It is a second implementation of the same grammar `kernelFloat` already ports,
differential-tested against MRI 3.3.11 in its own file, and it drags along the
`inspect()` / `rubyClassName()` helpers that exist only to spell its error
messages.

## Converged shape

Delete `Float()` from `cache/store.ts` and have `retrievePoolOptions` call
`kernelFloat` from `@blazetrails/ruby-compat`. Drop `inspect()` /
`rubyClassName()` if the `Integer()` story has already taken the other half and
nothing else in the file reads them; otherwise leave them for that story to
remove, and say so in the PR rather than half-deleting them.

Carry the MRI differential cases for the Float grammar over to
`kernel-float.trails.test.ts` rather than deleting them with the copy — any case
`kernelFloat`'s own tests do not already cover is coverage this repo loses.

## Acceptance criteria

- [ ] `packages/activesupport/src/cache/store.ts` declares no `Float()`;
      `retrieve_pool_options`' timeout arm calls `kernelFloat`.
- [ ] `grep -rn "invalid value for Float()" packages/*/src` returns hits only
      from ruby-compat.
- [ ] Every MRI-verified Float case the copy covered runs against `kernelFloat`.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new novel surface.
