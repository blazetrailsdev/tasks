---
title: "Establish the real cross-file reflection-memo poison mechanism (zero rebinds observed; documented cause is wrong)"
status: draft
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

PR #4863 (story `reflection-klass-cache-self-heal`) fixed the cross-file
reflection-memo poisoning that made PreloaderTest flake, by gating klass-derived
memos on a `modelRegistry.generation` counter. The fix is verified: the two-file
repro goes from 4 failed to 211 passed, and the #4006 band-aid is gone.

**But the documented CAUSE is wrong, in three places.** The story context, the PR
body of #4863, and the memory note `project_preloadertest_taggings_registry_leak`
all assert the mechanism is:

> a bespoke model registered under a canonical name by a sibling test file is
> resolved first and cached permanently (e.g. a bespoke sourceless `Tagging`)

Instrumenting `ModelRegistry.set` to log every mutation during the exact repro
(`pnpm vitest run --no-file-parallelism
packages/activerecord/src/associations/nested-through-associations.test.ts
packages/activerecord/src/associations.test.ts`) yields:

```text
FRESH registrations: 184
REBINDS:             0
```

**Zero rebinds.** No name is ever bound to a different class. Both files import
CANONICAL models from `test-helpers/models/` (`nested-through-associations.test.ts:7-34`),
and the canonical `Tagging` DOES declare a `tag` source (`test-helpers/models/tagging.ts:33`),
so the "bespoke sourceless Tagging" premise does not hold.

What actually heals it: `ModelRegistry.set` bumps the generation when
`super.get(name) !== model`, which is true for a FRESH registration
(`prev === undefined`) too — not just a rebind. So the poisoned memo is cleared
by a later fresh registration. That implies the poison is a memo formed under an
INCOMPLETE registry (most likely a negative memo — `_sourceReflectionCache = null`
or a klass resolved before its intended target was registered), not a shadowed
name.

This matters beyond bookkeeping: if the real mechanism is a negative memo cached
during an incomplete-registry window, then healing depends on some LATER
registration happening to bump the generation. A bad memo formed after the final
registration in a worker would never heal — a gap the current fix would not
cover, and which the "shadowing" model hides.

## Acceptance criteria

- [ ] Identify the specific memo that is poisoned in the repro and the exact
      window in which it forms (instrument the four `ThroughReflection` memos +
      `MacroReflection._klassCache`; the registry probe above is a good start).
- [ ] Confirm or refute the negative-memo-under-incomplete-registry hypothesis.
- [ ] If confirmed, determine whether a memo formed after the last registration
      can persist un-healed, and if so file/spec the follow-up fix (candidates:
      don't memoize negative resolutions; validate on read).
- [ ] Correct the now-known-wrong causal narrative in: the `ModelRegistry` doc
      comment (`associations.ts`, "a test file registering a bespoke model under a
      canonical name"), the `MacroReflection.klass` comment, and the
      `project_preloadertest_taggings_registry_leak` memory note.
- [ ] No behavior change required if the hypothesis is refuted — closing with the
      corrected narrative + evidence is a valid outcome.
