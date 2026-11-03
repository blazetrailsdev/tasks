---
title: "Port ActionMailbox::Engine and config/routes.rb, and load the engine from trailties/all"
status: draft
updated: 2026-11-03
rfc: "0216-actionmailbox-port"
cluster: amb-engine
packages: ["actionmailbox", "trailties"]
deps:
  [
    "actionmailbox-record-inbound-email-message-id-and-routable",
    "activestorage-engine",
    "trailties-all-loads-activestorage-engine",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/engine.rb:12-39`: `isolate_namespace`,
  `eager_load_namespaces`, the `config.action_mailbox` defaults
  (`incinerate`, `incinerate_after`, `queues` as an `InheritableOptions` of
  `incineration:` / `routing:`, `storage_service`), and initializers
  `action_mailbox.deprecator` (`before: :load_environment_config`) and
  `action_mailbox.config` (an `after_initialize` copying six options onto
  `ActionMailbox`).
- `config/routes.rb:4-25`: the `/rails/action_mailbox` ingress scope and the
  `rails/conductor/action_mailbox/` scope. This story draws the relay and
  conductor routes; each deferred ingress story draws its own.
- RFC 0212's Non-goals leave "ActionMailbox … railties pieces (`rails/all.rb`
  requires …)" unowned. `railties/lib/rails/all.rb:13` requires
  `action_mailbox/engine`; `packages/trailties/src/all.ts:27` lists it but
  has no `loadPath` entry, so the require raises the swallowed `LoadError`.
  `trailties-all-loads-activestorage-engine` (trails#9543) is the shape: a
  computed-specifier `import()` that avoids the package cycle
  (`all.ts:9-11`).
- `railties/lib/rails/application/configuration.rb:211-213` (already ported at
  `packages/trailties/src/application/configuration.ts:253-256`) starts
  reaching a real `config.action_mailbox`.

Railties tests: `railties/test/application/configuration_test.rb:3664-3772`
(11 "ActionMailbox.…" tests) and the `ActionMailbox.deprecator` assertion at
`:4273`, which `configuration-test-framework-deprecators` (RFC 0123) waits
on.

## Acceptance criteria

- The engine and both initializers are ported in Rails' order on
  `packages/trailties/src/engine.ts`; routes are drawn from the engine's
  `config/routes` as activestorage's are.
- `all.ts` loads `ActionMailbox::Engine` for `action_mailbox/engine` with no
  package cycle, covered in `packages/trailties/src/all.trails.test.ts`.
- The 11 configuration tests are ported where the configuration test file
  lives, names verbatim, and the deprecator assertion is added; the PR body
  says whether `configuration-test-framework-deprecators` is now unblocked
  for ActionMailbox.
