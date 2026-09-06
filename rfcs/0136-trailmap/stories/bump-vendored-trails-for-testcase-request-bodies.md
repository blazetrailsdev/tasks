---
title: "Bump the vendored trails pin so controller tests can post a request body"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::TestCase` in the vendored tarball cannot test an endpoint
that takes a request body, which is every mutation endpoint the JSON API
serves. Two workarounds now wait on the same one-line pin bump — this one and
the app shell's status-badge normalisation — so they are tracked together
rather than as two stories that run the same script.

`_process` assigns `request.parameters` unconditionally from its `params`
option alone:

```js
// node_modules/@blazetrails/actionpack/dist/actioncontroller/test-case.js:275
const allParams = { ...(options.params ?? {}) };
this.request.parameters = new Parameters(...);
```

`Metal#dispatch` then prefers that value (`request.parameters ?? ...`), and
because an empty `Parameters` is not nullish the `??` never falls through. The
`body:` option reaches `rack.input` and is never decoded, so `this.params` is
empty for any JSON body.

**This is already fixed upstream.** trails HEAD guards the assignment:

```ts
// packages/actionpack/src/action-controller/test-case.ts:354
if (params) (this.request as any).parameters = { ...params };
```

with `dispatch` reading `request.parameters` and falling through to the
getter that merges query and body (`metal.ts:229-230`). trailmap pins
`vendor/TRAILS_PIN` at `7cece02d`, which predates it.

## A second thing the same bump adopts

`app/helpers` reaching a view was fixed upstream by trails#7558 — a helper
module is now spliced into the view context, `allHelpersFromPath` globs the
trails `<name>-helper.ts` spelling, `ActionController::Helpers` is ported, and
`action_controller.set_helpers_path` reads `config.helpersPaths`. trailmap
still pins `7cece02d`, so `app/helpers` is inert here until the same bump.

## The workarounds to delete

`app/views/shared/_status-badge.html.tse` carries the badge's status
normalisation (blank or null becomes `unknown`) in the template because there
was nowhere else to put it; once the pin is bumped that moves to
`ApplicationHelper` and the partial calls it. The partial itself stays — a
partial is the right shape for markup.

`test/controllers/mutations-controller.test.ts` and
`test/controllers/read-models-controller.test.ts` each hand-build a rack env,
construct `new Request(...)` / `new Response()` and call
`controller.dispatch(...)` directly, bypassing `TestCase` entirely. It works
and exercises the real decode path, but it reimplements the harness in two
places and drifts from how every other controller test in the app is written.

## Converged shape

Bump the pin with `./scripts/vendor-trails.sh`, then replace both local `post`
/ `get` helpers with `ActionController.TestCase` and its `body:` option, and
move the badge normalisation onto a helper. The
assertions should not need to change — if they do, the harness is not
equivalent and that is worth knowing before more controller tests are written
against it.
