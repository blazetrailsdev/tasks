---
title: "activesupport: rescue_from rejects a plain function as its block, so a handler written the TS way does not boot"
status: draft
updated: 2026-10-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#41 (bump to trails `b9ad5f1759`). trailmap's health controller declared its
handler the way a TS author writes a block:

    this.rescueFrom(Error, function (this: HealthController) { return this.renderDown(); });

At the old pin that worked. At the new one the application does not boot: `rescueFrom`
(`packages/activesupport/src/rescuable.ts:36-50`) takes a trailing argument as the block only when
`rbBlockGivenP` says it is a block object, otherwise treats every argument as a class to rescue,
finds no `with:`, and raises "Need a handler. Pass the with: keyword argument or provide a block."
trailmap changed to `{ with: "renderDown" }`.

Rails: `vendor/rails/v8.0.2/activesupport/lib/active_support/rescuable.rb:51-66`,
`rescue_from(*klasses, with: nil, &block)`. A Ruby caller writes
`rescue_from(Exception) { render_down }`, and the block is unambiguous because it is not a
positional argument.

In TS the block IS a positional argument, so it has to be told apart from a class to rescue. The
port already has the test for that a few lines down: a class is a function whose `prototype`
property is not writable (`rescuable.ts`, the `klass` branch). A trailing plain function, which is
what an arrow or a `function () {}` is, cannot be a class to rescue and can only be the handler.

## Expected shape

`rescueFrom(Error, function () { ... })` and `rescueFrom(Error, () => ...)` register the function
as the handler, as `rescue_from(Error) { ... }` does, with no wrapper. A trailing class is still a
class to rescue. If the block-object form has to stay the only one, the error should say how to
write it, since "provide a block" describes what the caller believes they did.

## Acceptance criteria

- [ ] `rescueFrom(SomeError, function () {...})` and the arrow form both register and run the handler; tested.
- [ ] `rescueFrom(ErrorA, ErrorB, { with: "handler" })` is unchanged, and a trailing class is not mistaken for a block.
- [ ] `trails new`'s generated `HealthController`, if it declares a rescue, boots.
