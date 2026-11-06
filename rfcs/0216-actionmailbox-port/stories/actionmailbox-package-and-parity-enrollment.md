---
title: "Create packages/actionmailbox and enroll it in parity:api and parity:test"
status: ready
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: amb-infra
packages: ["actionmailbox"]
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox.rb:13-26` defines the namespace: it extends
`ActiveSupport::Autoload` (`Base`, `Router`, `TestCase`) and declares six
`mattr_accessor`s: `ingress`, `logger`, `incinerate` (default `true`),
`incinerate_after` (default `30.days`), `queues` (default `{}`) and
`storage_service`. `lib/action_mailbox/version.rb`, `gem_version.rb` (`VERSION`
8.0.2) and `deprecator.rb:4-6` (`ActionMailbox.deprecator`, a memoized
`ActiveSupport::Deprecation.new`) are the rest of the entry point.

`activestorage-parity-enrollment-and-package` (RFC 0209, trails#9444) is the
precedent: a `vendor/sources.ts` entry with `libPath`, `libEntryFile`,
`testPath` and `extraLibPaths`, and every registry that enumerates packages
by hand (`vendor/sources.test.ts`, `scripts/test-compare/extract-ts-tests.ts`,
`scripts/test-compare/compare.ts`, `scripts/api-compare/config.ts`
`MANIFEST_PACKAGES`, `lint-ruby-compat-calls.ts` `ENROLLED_PACKAGES`, the
`0/0/0` row in `scripts/test-compare/assertion-mismatch-mark.json`), plus
`ci.yml`, workspace and tsconfig references and a guard fixture.

## Acceptance criteria

- `packages/actionmailbox` exists, depending on activesupport, activerecord,
  activestorage, activejob, actionpack, trailties and mail, as
  `actionmailbox.gemspec` does.
- `src/action-mailbox.ts` ports `action_mailbox.rb` with the six accessors
  through activesupport's `mattrAccessor` at their Rails defaults
  (`incinerateAfter` a 30-day `Duration`), extended with `Autoload`; `version.ts`,
  `gem-version.ts` and `deprecator.ts` follow activestorage's files.
- The `vendor/sources.ts` entry has `extraLibPaths` for
  `app/models/action_mailbox`, `app/jobs/action_mailbox`,
  `app/controllers/action_mailbox` and `app/controllers/rails/conductor`, with
  `compareApi` and `compareTests` on, and every registry above names it.
- The four deferred ingress controllers stay unported rows, **not**
  `PERMANENT` (RFC Non-goals).
- CI runs the package's tests on all three adapter lanes.
