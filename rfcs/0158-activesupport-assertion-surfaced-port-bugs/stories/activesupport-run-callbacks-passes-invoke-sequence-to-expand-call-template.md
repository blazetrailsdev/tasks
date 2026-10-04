---
title: "activesupport: run_callbacks passes invoke_sequence itself to expand_call_template"
status: in-progress
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8470
claim: "2026-10-04T01:18:08Z"
assignee: "activesupport-run-callbacks-invoke-before-after-take-env-only"
blocked-by: null
closed-reason: null
---

## Context

`run_callbacks` (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:112-138`) hands an around
callback the proc it is itself running: `current.expand_call_template(env, invoke_sequence)` (`:127`). The proc
takes no arguments and closes over `next_sequence`, which the body advances before the call (`:125`) and
restores in `ensure` (`:130`).

`runCallbacks` (`packages/activesupport/src/callbacks.ts`) passes a bound copy instead,
`invokeSequence.bind(null, current.nested!, null, tracker)`, and `invokeSequence` takes `(start, resume, proceed)`:
the sequence to start at, the suspension state an awaited filter resumes from, and the tracker that lets the
around callback observe the nested promise. The Rails shape restores `next_sequence` as soon as the callback
returns, so an around callback that calls its block after an `await` would re-enter at `current` rather than
at `current.nested`.

The row surfaced on `parity:api:calls:args` when the free `runCallbacksOn` wrapper was deleted (story
`activesupport-callbacks-run-callbacks-is-the-instance-method-only`) and is receipted on `runCallbacks` with
`@missingRailsArgs expand_call_template — CONVERGEABLE` pointing at this story.

## Acceptance criteria

- [ ] `runCallbacks` passes `invokeSequence` itself to `expandCallTemplate`, as `callbacks.rb:127` does, with `next_sequence` advanced and restored as `:125,130` do, and the `@missingRailsArgs expand_call_template` receipt is deleted.
- [ ] An around callback that calls its block after an `await` still runs the nested sequence exactly once (existing async around tests in `callbacks.trails.test.ts` stay green), or the story is blocked with that specific language blocker.
