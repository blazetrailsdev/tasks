---
title: "CommandRecorder#respondToMissing drops the invented underscore-private gate"
status: draft
updated: 2026-11-06
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails:

- `packages/activerecord/src/migration/command-recorder.ts`: `CommandRecorder#respondToMissing` answers `!method.startsWith("_") && rbObjRespondTo(this.delegate, method)`.

Rails / Ruby:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/migration/command_recorder.rb:395-397`: `respond_to_missing?(method, _)` is `super || delegate.respond_to?(method)`.

The `_` prefix guard does not come from Rails. It is left over from `methodMissingProxy`'s reading of the `_` prefix as "private". Root CLAUDE.md § "Method visibility is compile-time only" rules out runtime privates, so Ruby's `respond_to?` reads "defined" here.

## Acceptance criteria

- [ ] `respondToMissing` is `rbObjRespondTo(this.delegate, method)` with no `_` arm. Rails' `super` (Kernel's `respond_to_missing?`, false) needs no TS spelling.
- [ ] The trap's forwarding follows `respondToMissing` unchanged.
- [ ] `command-recorder.trails.test.ts` "does not forward a private delegate member, the way public_send does not" is converged or parked as `it.skip` with `PERMANENT-SKIP:` citing § "Method visibility is compile-time only".
