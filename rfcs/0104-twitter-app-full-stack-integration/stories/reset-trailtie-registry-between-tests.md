---
title: "reset-trailtie-registry-between-tests"
status: claimed
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-03T23:18:36Z"
assignee: "converge-integration-session-to-rack-test-session"
blocked-by: null
closed-reason: null
---

## Context

`Trailtie._registry` (`packages/activesupport/src/trailtie.ts`) is a
process-global array — the port of Rails' `Railtie.subclasses`
(`railties/lib/rails/railtie.rb:148-150`, backed by
`ActiveSupport::DescendantsTracker`). `Configuration._options` and
`_toPrepareBlocks` (`trailtie/configuration.ts`) are likewise `@@`-level state,
matching `railtie/configuration.rb:8-9`.

`packages/activesupport/src/trailtie.test.ts` registers ~15 throwaway subclasses
(`MyTrailtie`, `Early`, `Late`, `AnonSealed`, `Grand`, …) with no cleanup, and
`Trailties.all` (`trailties/src/engine/trailties.ts:16-18`) builds an app's
railtie collection by filtering `Trailtie.subclasses()` on direct-subclass
identity — so a leaked test class would be seen as a sibling railtie by any
`Engine`/`Application` boot that shared the module registry.

Today that cannot happen: `vitest.config.ts` sets no `isolate`, so vitest's
default `isolate: true` gives every test FILE a fresh module registry even when
a worker process is recycled. Verified on PR #7386 by running a probe test file
alongside `trailtie.test.ts` in one invocation and asserting
`Trailtie.subclasses()` does not contain `MyTrailtie` — it passed, and the
combined 104-file run (which includes `engine.test.ts`, building real `Trailties`
collections) is green.

The gap is that the guarantee rests on a vitest default rather than on anything
in the code: flipping `isolate: false` — a plausible future speed change, since
it is the standard vitest performance lever — would silently make these classes
visible to other files in the same worker. Rails does not have this problem
because `railtie_test.rb` uses `include ActiveSupport::Testing::Isolation`
(subprocess per test), which trails has no analogue for.

## Converged shape

An explicit reset for the registry and the `@@`-level `Configuration` state, on
the model of `resetLoadHooks` (`activesupport/src/lazy-load-hooks.ts:99`), which
carries the same justification and the same
`@noRailsEquivalent PERMANENT — a TS module's state outlives the suite, so tests
need an explicit reset` receipt. `trailtie.test.ts` then snapshots and restores
around each test, as its pre-fold version did.

## Acceptance criteria

- [ ] A reset entry point for `Trailtie._registry` plus `Configuration`'s
      `@@`-level state, receipted like `resetLoadHooks`.
- [ ] `activesupport/src/trailtie.test.ts` restores registry state per test, so
      its throwaway subclasses cannot outlive the file regardless of `isolate`.
- [ ] The guarantee holds with `isolate: false`: a probe test file asserting
      `Trailtie.subclasses()` is free of the throwaway classes passes when run in
      the same worker as `trailtie.test.ts`.
