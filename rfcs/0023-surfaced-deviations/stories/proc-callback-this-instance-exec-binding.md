---
title: "Proc/block callbacks bind this to record (Rails instance_exec), not class"
status: done
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 11
pr: 3493
claim: "2026-06-16T19:48:42Z"
assignee: "proc-callback-this-instance-exec-binding"
blocked-by: null
---

## Context

In Rails, proc/block callbacks (`before_destroy do |object| ... end`) run via
`instance_exec`, so inside the block `self` IS the record (and the record is
also yielded as the block arg). trails' callback runner diverges: function-style
filters compile to `ProcCall` (`packages/activesupport/src/callbacks.ts`,
`ProcCall.makeLambda` ~line 285) which invokes `f(target, value)` with **no
`.call(target)`**, and `_invoke` (~line 750) calls `cb(target)`. So inside a
function/arrow callback `this` is NOT the record — it is `undefined` (plain
function) or the lexical class object (arrow defined in a `static {}` block),
while the record arrives only as the first argument.

Surfaced in PR #3469: canonical `content.ts` models read `this.id` /
`this.destroyCount` and silently mutated the wrong object — the
`ContentWhichRequiresTwoDestroyCalls` first-pass abort never fired (test passed
vacuously). Fixed those models to read the `record` arg, but other fixture
models are still latently broken the same way, e.g. `chef.ts` (~28-39) and
`eye.ts` (~70-82), whose `function (this: X) { this.<counter>++ }` callbacks
mutate the class object, not the record. They are unasserted so nothing fails today.

Rails ref: `ActiveSupport::Callbacks::CallTemplate::InstanceExec*` (block
callbacks run with the record as `self`).

## Acceptance criteria

- [ ] Decide the convergence target: either bind `this` to the record for
      proc/block callbacks (Rails `instance_exec` semantics) in the callback
      runner, OR ratify "read the record arg" as the trails contract and audit
      every fixture/model callback to stop reading `this`.
- [ ] If converging the runner: `ProcCall`/`_invoke` bind `this` to the record;
      add a regression test asserting `this === record` inside a block callback.
- [ ] Audit + fix fixture models that read `this` in function callbacks
      (chef.ts, eye.ts, and any others found by grepping
      `beforeDestroy(function (this:` / `before*(function (this:`).
- [ ] No test renamed; behavior matches Rails.
