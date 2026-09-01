---
title: "method_missing's proxy moves to ruby-compat with core NameError and NoMethodError, leaving Rails' name_error.rb reopening behind"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/method-missing-proxy.ts` (**114 lines**) is the
trails idiom for Ruby's `method_missing` — a language hook JS does not have,
only `Proxy`. Its own receipt says exactly that, and names the precedent:

```
@noRailsEquivalent PERMANENT — Ruby resolves an undefined method through
`method_missing` at the language level; JS has no such hook, only `Proxy`.
No amount of porting removes the need for a TS-side shape, so this is the one
shared one, the way `include()` is the one shape for Ruby `include`.
```

`include()` is `move-module-mixin-primitives-to-ruby-compat`. This is its
sibling, and the file itself makes the argument.

The audit's earlier reservation was test #4: the file imports `NameError` from
`./core-ext/name-error.js`, which IS Rails-anchored. **The resolution is that
the errors come from ruby-compat only**, and the split is clean rather than a
compromise, because Rails' file is a _reopening_:

- `vendor/rails/activesupport/lib/active_support/core_ext/name_error.rb` is
  `class NameError` reopened to add **exactly three members** —
  `missing_name`, `missing_name?`, and the private `real_mod_name`. It does not
  declare the class, the constructor, or `NameError#name`.
- Those are Ruby core: `vendor/ruby/error.c:3348`
  (`rb_eNameError = rb_define_class("NameError", rb_eStandardError)`),
  `:3349` (`initialize`), `:3350` (`name`), and
  `vendor/ruby/error.c:3360`
  (`rb_eNoMethodError = rb_define_class("NoMethodError", rb_eNameError)`).
- So `NameError`'s **class and `constantName`** (trails' spelling of Ruby's
  `name`) belong in ruby-compat, and `missingName()` / `isMissingName()` —
  today at `core-ext/name-error.ts:39,52` — **stay in activesupport**, where
  `parity:api` measures them against `name_error.rb`. Moving those two would
  destroy working coverage, which README §1's first test forbids.

**The reopening has an exact in-tree precedent**, so no idiom needs inventing:
`activesupport/src/core-ext/range/compare-range.ts:2,19` imports `Range` from
`@blazetrails/ruby-compat/range` and reopens it with
`declare module "@blazetrails/ruby-compat/range" { interface Range<T> { … } }`
plus `prepend()`. One class identity, Rails' members measured in activesupport,
the core class in the leaf. `core-ext/name-error.ts` takes the same shape.
Note what this rules out: making activesupport's `NameError` a _subclass_ of
ruby-compat's would fragment identity, and 82 references across four packages
(`actionpack` 20, `activerecord` 14, `activemodel` 6, `activesupport` 42)
narrow on the one class today.

Four-part test (README §1, §2, §4), item by item, for the three things that
move:

1. **No `vendor/rails/` counterpart.**
   - `method-missing-proxy.ts`: confirmed —
     `parity:api:extra --package activesupport` scores it
     `1 novel, 0 moved [no Rails counterpart]`; no Rails file maps onto it.
   - `NoMethodError` (`method-missing-proxy.ts:10`): Ruby corelib. RFC
     `0111/one-shared-nomethoderror-class` says so in its own words —
     "`name-error.ts` maps onto `core_ext/name_error.rb`, which does NOT define
     `NoMethodError` (Ruby corelib does), so the export may need a
     `@noRailsEquivalent PERMANENT` tag naming corelib as the anchor — the same
     treatment RFC 0089 describes for the other interpreter primitives."
     RFC 0129 supersedes 0089 and IS that home.
   - core `NameError`: the class and `name`; Rails only reopens it, per above.
2. **MRI counterpart.** `vendor/ruby/vm_eval.c:2570`
   (`rb_define_private_method(rb_cBasicObject, "method_missing",
rb_method_missing, -1)`) for the proxy; `vendor/ruby/error.c:3348-3350` for
   `NameError`; `vendor/ruby/error.c:3360` for `NoMethodError`. All resolve at
   the pinned `v3_3_11`.
3. **trails actually calls it.** `methodMissingProxy`: **3 call sites**, all in
   activerecord — `normalization.ts:90`,
   `connection-adapters/connection-management.ts:43`,
   `migration/command-recorder.ts:21` — plus the barrel export at
   `activesupport/src/index.ts:661` and five in-tree doc comments citing it as
   the canonical shape (`array-inquirer.ts:13`, `string-inquirer.ts:12`,
   `time-with-zone.ts:119`, `delegation.ts:212`, `testing/assertions.ts:565`).
   `PROTOCOL_PROBES`: imported by `delegation.ts:8,213`. `NameError`: 82
   references across 4 packages. `NoMethodError`: 8 raise sites per 0111.
4. **Workspace dependencies, named individually.** `method-missing-proxy.ts`
   has exactly **one** import: `{ NameError } from "./core-ext/name-error.js"`
   (line 1). Once core `NameError` and `NoMethodError` live in ruby-compat,
   that import points at the leaf and the file has **no workspace dependency
   left**. `respondsTo` (`:42`) and `PROTOCOL_PROBES` (`:31`) import nothing.
   This is the whole of the blocker, and moving the errors is what clears it.

**Drive-by duplicate found while measuring:**
`activesupport/src/deprecation/proxy-wrappers.ts:24` declares its own
`PROTOCOL_PROBES` set — the same list minus `asymmetricMatch` — and uses it in
the same `get`-trap position (`:30`). That is a second copy of a ruby-compat
primitive under the same name, exactly what
`no-ruby-compat-reimplementation-lint` is being built to catch. Converge it in
this PR if it fits under the ceiling; otherwise file it.

**Coordinate with `0111/one-shared-nomethoderror-class`** (draft, RFC
0111-error-class-message-parity, cluster `duplicate-error-classes`). It
converges eight fragmented `NoMethodError` declarations, four of which wrongly
extend bare `Error` and so break Ruby's `NoMethodError < NameError`. It names
`method-missing-proxy.ts:10` as its first site and says the shared class should
live "beside `NameError`". This story **supplies** that class in ruby-compat and
converges the one site it owns; 0111 flips the other seven onto it. Do not
converge 0111's other seven here, and say so in the PR body so the two do not
collide.

## Acceptance criteria

- `packages/ruby-compat/src/` gains, each with a resolving `vendor/ruby/…:LINE`
  citation and a `@noRailsEquivalent PERMANENT` receipt on every export:
  - core `NameError` (the class, its constructor, and `constantName` — Ruby's
    `NameError#name`), cited to `vendor/ruby/error.c:3348-3350`;
  - `NoMethodError extends NameError`, cited to `vendor/ruby/error.c:3360`,
    **exported** (its "local to this module" rationale is retired — 0111 shows
    that rationale is the workaround fragmentation forces);
  - `methodMissingProxy` and `PROTOCOL_PROBES`, cited to
    `vendor/ruby/vm_eval.c:2570`.
- `activesupport/src/core-ext/name-error.ts` keeps `missingName()` and
  `isMissingName()` and nothing else, reopening ruby-compat's class with the
  `compare-range.ts:19` shape — `declare module "@blazetrails/ruby-compat/…"`
  plus prototype assignment — so there is **one** `NameError` class identity and
  the two Rails methods stay matched against `name_error.rb`. It re-exports
  `NameError` so `activesupport/src/index.ts:1` and all 82 references are
  untouched.
- `activesupport`'s `parity:api` coverage of `name_error.rb` does not fall:
  `missing_name` and `missing_name?` still match. A negative `parity:api` delta
  on that file means the split was made in the wrong place.
- `activesupport/src/method-missing-proxy.ts` becomes a bare re-export shim;
  `index.ts:661` still exports `methodMissingProxy`, `delegation.ts:8` still
  imports `PROTOCOL_PROBES`, and all three activerecord call sites are
  untouched. The shim is deleted by `delete-ruby-compat-reexport-shims`.
- `packages/ruby-compat` still has no `dependencies` block — after the move
  `method-missing-proxy.ts` imports only from within the package.
- `deprecation/proxy-wrappers.ts:24`'s duplicate `PROTOCOL_PROBES` is converged
  onto the ruby-compat export, or filed as its own story with the `file:line`
  above.
- 0111's other seven `NoMethodError` sites are **not** touched; the PR body
  names them and states that 0111 owns them.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to exactly the exports added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:test` delta non-negative.
- Tests move with the code and keep their names; a Rails-anchored test file
  (matched by `parity:test`) STAYS in activesupport.
- `no-freeform-comments` is `error` on `packages/ruby-compat/**`: the relocated
  header prose survives only inside one block comment that also carries the
  `vendor/ruby/...:LINE` citation — a citation line BREAKS a `//` run.
- A new cross-package subpath (e.g. `@blazetrails/ruby-compat/name-error` for
  the `declare module` target) is registered in all four places: the vitest
  alias (trailing-slash prefix entry ABOVE the bare one) and both dx-test
  tsconfigs' `paths` maps. `pnpm typecheck` does not catch a miss;
  `pnpm test:types` does.
