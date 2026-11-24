---
title: "actionmailbox: controller namespaces come from the loader, not constSet seats"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
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

trails#10688 moved Action Mailbox's controllers to `packages/actionmailbox/lib/app/controllers/**`, autoloaded by the application's loader. Rails gets `ActionMailbox::Ingresses::{Mailgun,…}` and `Rails::Conductor::ActionMailbox::InboundEmails` as Zeitwerk implicit namespaces from the directories (`vendor/rails/v8.0.5.2/actionmailbox/app/controllers/action_mailbox/ingresses/`, `app/controllers/rails/conductor/`). The port instead seats them by name in `packages/actionmailbox/lib/action-mailbox.ts` (`constSet(ActionMailbox, "Ingresses", …)`, `constSet(Trails, "Conductor", …)`), and each controller file `constSet`s itself onto them. This is needed only because the class-path check (`scripts/api-compare/class-paths.ts --check`) and the in-process test harness (`packages/actionmailbox/test/support/database/setup.ts`) load the controllers without the loader. `Trails::Conductor::BaseController` also still lives in `app/controllers/action-mailbox/base-controller.ts`. Rails has it at `app/controllers/rails/conductor/base_controller.rb`, but parity maps both `base_controller.rb` files to one bucket.

## Acceptance criteria

- [ ] The namespaces come from the loader as Zeitwerk's implicit namespaces do, with no `constSet` namespace seats in `action-mailbox.ts` and no self-seating `constSet` lines in the controller files.
- [ ] `Trails::Conductor::BaseController` lives at `app/controllers/trails/conductor/base-controller.ts`, and parity can bucket the two `base_controller.rb` files apart.
- [ ] `pnpm parity:class-paths:check` and the actionmailbox suite pass.
