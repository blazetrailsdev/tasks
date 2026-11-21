---
title: "activesupport: ForkTracker.hook! prepends onto Process' singleton without a fake class"
status: done
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10515
claim: "2026-11-21T19:08:34Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ForkTracker.hook!` is `::Process.singleton_class.prepend(CoreExt)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/fork_tracker.rb:27-29`).
trails#10445 ported it in `packages/activesupport/lib/fork-tracker.ts` (`hookBang`) as
`prepend({ prototype: Process }, ForkTracker.CoreExt)`. It fakes a class so that
`prepend` writes onto `Process`' statics, because `rbObjSingletonClass`
(`packages/ruby-compat/lib/object.ts:255`) raises `TypeError` for a class receiver.
The call site carries no receipt.

## Acceptance criteria

- [ ] `hookBang` prepends `CoreExt` onto `Process`' singleton by a ruby-compat path
      that models `singleton_class.prepend` for a class receiver (for example, `prepend`
      accepting a class's static side), with no fake `{ prototype }` object.
- [ ] `CoreExt._fork`'s `rbCallSuper` resolves through that prepend.
