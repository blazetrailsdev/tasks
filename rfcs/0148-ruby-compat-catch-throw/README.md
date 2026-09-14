---
rfc: "0148-ruby-compat-catch-throw"
title: "Port Kernel#catch / Kernel#throw into ruby-compat and converge the two per-tag copies onto it"
status: active
created: 2026-09-14
updated: 2026-09-14
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - activerecord
  - activemodel
  - actionpack
  - i18n
clusters:
  - fidelity
related-rfcs:
  - "0129-ruby-compat"
  - "0113-arm-parity"
  - "0082-ruby-ts-idiom-conversion-classes"
priority: 3
---

# RFC 0148 — `Kernel#catch` / `Kernel#throw` in ruby-compat

## Summary

Ruby's `catch(tag) { … }` / `throw tag, value` is a non-local exit keyed on a
tag, not an exception (`vendor/ruby/vm_eval.c:2244-2391`). trails has no port
of it. Instead it has two single-tag copies — `throwAbort` / `isAbortSignal`
for `:abort` (`packages/activesupport/src/callbacks.ts:8-16`) and
`throwException` / `catchException` for `:exception`
(`packages/i18n/src/throw-catch.ts`) — each an invented shape carrying a
`@noRailsEquivalent PERMANENT` receipt for a method Ruby does define. This RFC
ports the real pair once, as `kernelCatch` / `kernelThrow` +
`UncaughtThrowError` in ruby-compat, then deletes both copies by moving their
callers onto it. Any later port that meets `catch`/`throw` — warden's
`catch(:warden)` is the motivating one — uses it directly.

## Motivation

- **Two deviations for one Ruby method.** `throwAbort()` throws a bare JS
  `Symbol` and `isAbortSignal(e)` is checked at 22 non-test sites across
  activesupport, activemodel, activerecord and actionpack (`grep -rn
"isAbortSignal\|throwAbort" packages --include=*.ts | grep -v test`).
  i18n's `catchException` wraps a `ThrownException extends Error`. Neither
  is generic, neither raises `UncaughtThrowError`, and the two disagree on
  whether the thrown thing is an `Error`. Both receipts say `PERMANENT`; that
  is false — the language shortcoming (JS has no non-exceptional unwind) is
  real, but the _method_ has a faithful port.
- **The next consumer is already queued.** The warden codegen audit
  (`~/.btwhooks/data/github/blazetrailsdev/trails/audits/warden-codegen-20260914T170853Z.md`)
  names the absent idiom as its #1 risk: warden's control flow is
  `catch(:warden)` at `manager.rb:34` and `proxy.rb:368`, `throw(:warden, opts)`
  at `proxy.rb:134` and in `Strategies::Base#halt!`/`custom!`. Without a
  settled shape a codegen run invents a third copy.
- **The arm ratchet already folds these names** —
  `scripts/api-compare/compare.ts:353` `TS_CONSTRUCT_SKELETON_NAMES` maps
  `throwAbort`/`throwException` → `throw` and `catchException` → `try` so the
  missing-`throw` mark (RFC 0113) does not flag them. That table is the receipt
  the generic port inherits; today it has to be extended per invented name.

## Design

### 1. `kernelCatch` / `kernelThrow` / `UncaughtThrowError` in ruby-compat

New file `packages/ruby-compat/src/kernel-catch.ts` (path per the
`kernel-float.ts` / `kernel-integer.ts` precedent; names per
`RUBY_COMPAT_EXPORTS`' `["Kernel#Float", "kernelFloat"]` row —
`catch`/`throw` are JS reserved words, the same reason `Float` got the prefix).

```ts
export function kernelCatch<T>(tag: unknown, block: (tag: unknown) => T): T | unknown;
export function kernelCatch<T>(block: (tag: object) => T): T | unknown; // tag = fresh object
export function kernelThrow(tag: unknown, value: unknown = null): never;
export class UncaughtThrowError extends ArgumentError {
  readonly tag;
  readonly value;
}
```

Semantics, each traced to MRI and to `vendor/ruby/spec/ruby/core/kernel/{catch,throw}_spec.rb`:

1. **Tag identity.** `rb_throw_obj` walks the tag chain comparing `tt->tag == tag`
   (`vm_eval.c:2258-2264`). JS `===`. A Ruby Symbol is a JS string
   (CLAUDE.md), so `":warden" === ":warden"` matches; a plain object tag
   matches only itself.
2. **Uncaught raises at the THROW site, before unwinding.** `vm_eval.c:2266-2272`
   raises `UncaughtThrowError` (`< ArgumentError`, `error.c:3216`) with message
   `uncaught throw <tag.inspect>` when no enclosing `catch` holds the tag. This
   needs an active-tag stack (§2), not a try/catch at the top.
3. **Return value.** The block's value when nothing is thrown; the thrown
   `value` (default `nil` → `null`) when caught.
4. **Blockless `catch`** yields a fresh `Object.new` tag
   (`catch_spec.rb:62`).
5. **Not an exception.** In Ruby a `rescue Exception` between `throw` and
   `catch` does not intercept it. The JS carrier is therefore a private,
   non-`Error` object (a `ThrowSignal` brand), and every ported `rescue`
   (`try { } catch (e) { if (!(e instanceof X)) throw e; … }`) already
   re-throws it because it is not an `instanceof` anything. Ported bare
   `rescue => e` bodies must re-throw a `ThrowSignal`; the story audits the
   existing bare catches on the abort path.
6. **Async blocks.** If `block` returns a thenable, the tag is popped when it
   settles, and a rejection carrying a matching `ThrowSignal` resolves to its
   value. This is the `set; yield; ensure restore` → settle rule already in
   memory, and it is what lets `kernelCatch(":warden", () => app.call(env))`
   wrap a Promise-returning Rack app. The sync path stays sync — a sync block
   returns a plain value.

### 2. The active-tag chain is per execution context

MRI's chain hangs off the execution context (`ec->tag`). Its trails analogue
is ruby-compat's `AsyncContext` (the `Thread.new` = `withExecutionContext`
rule in memory, RFC 0147). The stack lives in an `AsyncContext` variable, so
two interleaved requests each see only their own enclosing `catch`es. A
module-global array would let request A's `throw :warden` find request B's
`catch` and be silently swallowed instead of raising.

### 3. Converge the two copies

- **i18n:** `throwException(v)` → `kernelThrow(":exception", v)`;
  `catchException(f)` → `kernelCatch(":exception", f)` at the 7 sites
  (`i18n.ts:343,370`, `backend/chain.ts:71,84,99,105`, `backend/base.ts:253,260,364`;
  Ruby `i18n.rb:394`, `backend/chain.rb:61-88`). Delete `throw-catch.ts` and
  its two `PERMANENT` receipts.
- **activesupport callbacks:** `throwAbort()` → `kernelThrow(":abort")`
  (Rails `throw(:abort)`, `has_one_association.rb:18,34`,
  `has_many_association.rb:23`, `autosave_association.rb:212`);
  `try { … } catch (e) { if (!isAbortSignal(e)) throw e; halt }` →
  `kernelCatch(":abort", …)` in the shape of `callbacks.rb:667` and
  `collection_association.rb:400,462`. Delete `throwAbort` / `isAbortSignal`
  and the `@noRailsEquivalent` receipts they carry; retire their
  `TS_CONSTRUCT_SKELETON_NAMES` rows in favour of `kernelThrow` → `throw`,
  `kernelCatch` → `try`.
- Test-helper models (`test-helpers/models/{author,bird,bulb,…}.ts`) that
  call `throwAbort()` move too; they mirror Rails models calling
  `throw :abort`.

### 4. Parity

- `RUBY_COMPAT_EXPORTS` gains `["Kernel#catch", "kernelCatch"]`,
  `["Kernel#throw", "kernelThrow"]` so the call gate credits a Ruby
  `catch`/`throw` against the ruby-compat spelling.
- `parity:test` enrolls `catch_spec.rb` / `throw_spec.rb` the way the other
  ruby/spec mspec files are enrolled for ruby-compat. Two examples cannot
  port and get `PERMANENT-SKIP` stubs: "raises an ArgumentError if a String
  with different identity is thrown" (`catch_spec.rb:37`) and "catches a
  String when thrown a String with the same identity" (`:49`) — JS strings
  have no identity distinct from value. "is a private method"
  (`catch_spec.rb:124`, `throw_spec.rb:77`) is the standard visibility
  skip (CLAUDE.md "Method visibility is not a runtime fact").

## Non-goals

- **Porting warden.** That is its own RFC pending the vendoring-policy
  decision the audit raises; this RFC only removes its #1 prerequisite.
- **A generic `rescue` translation.** Bare JS `catch` blocks swallowing a
  `ThrowSignal` are fixed where they sit on the abort/exception paths, not
  swept repo-wide.
- **Making `catch` synchronous over an async block.** No JS can do it; §1.6
  is the ratified shape, same as CLAUDE.md's serialization and Relation
  sections.

## Alternatives considered

- **Keep per-tag helpers, add `throwWarden`.** A third copy of the same
  deviation; CLAUDE.md says converge, never sibling.
- **Carry the throw as an `Error` subclass** (i18n's current shape). Every
  ported `rescue StandardError` would intercept it, which Ruby's does not; and
  it builds a stack trace per non-local exit on a hot path (every halted
  callback).
- **Module-global tag stack.** Wrong under interleaved async requests (§2).
- **Raise `UncaughtThrowError` at the top of an unwinding throw instead of at
  the throw site.** Loses the site and, worse, can never be reached if the
  throw escapes into a Promise nobody awaits.

## Rollout

1. `port-kernel-catch-throw` — the ruby-compat port, its tests, the parity
   rows and skeleton fold. Lands alone.
2. `converge-i18n-onto-kernel-catch-throw` and
   `converge-callbacks-onto-kernel-catch-throw` — independent of each other,
   both dep on 1, each from `main`.

## Verification

- `grep -rn "throwAbort\|isAbortSignal\|catchException\|throwException" packages --include=*.ts` → 0.
- `packages/i18n/src/throw-catch.ts` deleted; the two `@noRailsEquivalent PERMANENT` receipts it carried are gone; no new receipt added.
- `TS_CONSTRUCT_SKELETON_NAMES` has no per-invented-name rows, only `kernelThrow`/`kernelCatch`.
- `parity:test` credits `catch_spec.rb` + `throw_spec.rb`: 21 of 24 examples, 3 `PERMANENT-SKIP`.
- `pnpm parity:api:calls`, `parity:api:calls:args`, arm-throw mark: non-increasing.

## Open questions

1. **Does `AsyncContext` propagate through `withExecutionContext` the way the
   tag chain needs?** Recommendation: yes — it is the same primitive
   RFC 0147 already uses for lease identity; story 1 adds a test with two
   interleaved `kernelCatch` blocks under `Promise.all` to prove a cross-
   context throw raises `UncaughtThrowError` rather than being caught.
   Resolved by that test; not a blocker.

## Changelog

- 2026-09-14: initial RFC
