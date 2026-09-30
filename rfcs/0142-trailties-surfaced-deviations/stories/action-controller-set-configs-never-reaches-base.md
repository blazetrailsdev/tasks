---
title: "action-controller-set-configs-never-reaches-base"
status: claimed
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps:
  - lazy-route-set-url-helpers-method-missing-module
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-09-30T14:42:47Z"
assignee: "action-controller-set-configs-never-reaches-base"
blocked-by: null
closed-reason: null
---

## Context

In a freshly generated app, `config/environments/test.ts` sets
`this.config.actionController.allowForgeryProtection = false`, matching Rails'
`config/environments/test.rb.tt:29`. After booting in the test env:

```text
app.config.actionController.allowForgeryProtection = false
ActionController.Base.allowForgeryProtection       = true
ActionController.Base.logger                       = unset
```

So `action_controller.set_configs`' `on_load(:action_controller)` block
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:67-92`,
ported at `packages/trailties/src/trailties/action-controller.ts:77-116`) has
had no effect on `Base`. It isn't just this key: the block also sets `logger`
(`:52`), and that is unset too. `onLoad` replays for an already-loaded base
(`packages/activesupport/src/lazy-load-hooks.ts:30-32`), and `base.ts:941` fires
`runLoadHooks("action_controller", Base)` as `base.rb:330` does. So the break is
either the initializer not running in this boot, or the `respond_to?(k)` /
`send(k, v)` dispatch (`rbObjRespondTo(base, "allowForgeryProtection=")` /
`rbFSend`) not reaching the `configAccessor` setter.

Visible effect: the scaffold's generated controller tests (ported from Rails'
`functional_test.rb.tt`, #8253) fail. The three non-GET ones (create, update,
destroy) raise `ActionController::InvalidAuthenticityToken`, so `pnpm test` is
red on a fresh `trails new` + `generate scaffold`.

Found re-running the root README quickstart (PR #8195) on `main` at `1721b9a448`.

## Acceptance criteria

- [ ] After boot, every non-filtered `config.action_controller.*` option is
      applied to `ActionController::Base` (at least `allowForgeryProtection`
      and `logger`), per `railtie.rb:67-92`.
- [ ] `trails new` + `generate scaffold` + `pnpm test` passes all generated tests.
- [ ] A test boots a generated app in the test env and asserts
      `ActionController.Base.allowForgeryProtection === false`.
