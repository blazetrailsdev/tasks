---
title: "Delegation.generate reads a String target's accessor as a property, swept repo-wide"
status: ready
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The story `flash-reader-is-a-hand-written-getter-not-a-delegate-call` asks `Delegation.generate` (`packages/activesupport/lib/delegation.ts`) to emit an accessor for a String `to:` whose target member is an accessor. Rails' `delegate :flash, to: :request` is at `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:11`, and `generate` is at `vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:21`.

A String target has no class when the delegate is defined, so the choice can only be made when the property is read. In a trial during the trails#10146 bundle, a read-time getter on every String-target delegate (returning the target's value for an accessor, otherwise a bound method) broke:

- every caller that calls such a delegate as a method: `ThroughAssociation`'s `sourceReflection` (`packages/activerecord/lib/associations/through-association.ts:206`, and every `this.sourceReflection()` in `has-many-through-association.ts`), the view `params` / `actionName` / `response` delegates in `packages/actionview/lib/helpers/controller-helper.ts`, `sendPreloadLinksHeader`'s `this.response!()` in `packages/actionview/lib/helpers/asset-tag-helper.ts`, and inline test templates such as `params().get(...)` in `actionview/test/actionpack/controller/render.test.ts`;
- six activesupport tests: "delegation invokes the target exactly once", "delegation line number" and "delegate line with nil" in `test/core-ext/module.test.ts` (an accessor has no `rbObjMethod` source location), and "returns a function-valued accessor's value without calling it" plus the two reader/writer-pair tests in `test/delegation.trails.test.ts`.

## Acceptance criteria

- `Delegation.generate` decides accessor or method once, for a String target, in a way that keeps `rbObjMethod(...).sourceLocation()`, evaluates the target exactly once, and keeps the reader/writer pairing.
- Every String-target delegate whose Rails target is a zero-arg reader is read as a property at each call site, swept across activerecord, actionview, actiontext, actionmailbox and solid-queue (list them with `grep -rn "delegate.call" packages/*/lib`).
- `flash-reader-is-a-hand-written-getter-not-a-delegate-call` depends on this story.
