---
title: "call gate compares an includer's constructor against the included module's initialize"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Thor::Group` (story `port-thor-group`).

`Thor::Group` has no `initialize` of its own; it inherits `Thor::Base#initialize`
(`vendor/thor/v1.3.2/lib/thor/base.rb:53-113`) through `include Thor::Base`
(`vendor/thor/v1.3.2/lib/thor/group.rb:270`). The port keeps that body in
`packages/trailties/src/thor/base.ts` as the symbol-keyed `[initialize]` hook, and
`Group`'s constructor (`packages/trailties/src/thor/group.ts`) is only the chain seat,
`initializeIncludedModules(this, ...args)`, exactly as `Thor`'s is in `thor.ts`.

`scripts/api-compare/compare.ts` expands an includer's bucket with the included module's
methods, and for `initialize` the only candidate offered is `constructor`
(`moduleInitializeCandidates`, `compare.ts:3655`, offers the `[initialize]` hook only when the
EXPECTED file declares one). So `group.rb`'s inherited `initialize` direct-matches `Group`'s
constructor and `checkCalls` compares `Thor::Base#initialize`'s body against a one-line
constructor: seven `parity:api:calls` rows (`class_options`, `merge`, `stop_on_unknown_option?`,
`map`, `disable_required_check?`, `new`, `check_unknown_options?`).

`Thor` itself escapes only because the extractor files the reopened `class Thor` under `base.rb`,
where the same `initialize` is reported as plainly missing (`base.rb` reads 63/70; the seven
misses are `options`, `options=`, `parent_options`, `parent_options=`, `args`, `args=`,
`initialize`). That is the second half of the same gap: the hook is written as an assignment,
`(ThorBase as ...)[initialize] = function`, at `base.ts:205`, which the extractor does not record
as `[initialize]`, unlike a `static [initialize]` class member.

trails#8526 (`port-thor-group`) shipped the comparer half: `includerConstructorIsInitializeSeat`
(`scripts/api-compare/compare.ts`) reads a constructor that calls `initializeIncludedModules` and
nothing else as the include seam, so `Group`'s constructor carries no receipt. What remains is the
extractor half.

## Acceptance criteria

- [ ] The extractor records an assigned `mod[initialize] = function` hook (thor's `base.ts`,
      `invocation.ts`, `shell.ts`, `actions.ts`) as `[initialize]`, so `base.rb`'s, `invocation.rb`'s
      and `shell.rb`'s `initialize` credit and each body is call-compared in its own file.
- [ ] `mixinMethodCreditedToOwnFile` offers the `[initialize]` hook as a candidate, so the seam for
      an includer's constructor is the general mixin arm and `includerConstructorIsInitializeSeat`
      can be deleted.
- [ ] A `scripts/api-compare` test covers the assigned-hook form.
