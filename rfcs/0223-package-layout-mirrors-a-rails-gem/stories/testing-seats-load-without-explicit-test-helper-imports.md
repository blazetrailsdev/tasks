---
title: "Seat ActionMailer/ActiveJob TestHelper without explicit imports in generated test_helper and abstract_unit"
status: draft
updated: 2026-11-10
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
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

trails#9962 made the `action_dispatch_integration_test` hooks read `ActionMailer.TestHelper`, `ActionMailer.TestCase.ClearTestDeliveries` and `ActiveJob.TestHelper` when the hook fires (`packages/trailties/lib/trailties/action-mailer.ts`, `active-job.ts`), as `vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:65-68` and `vendor/rails/v8.0.2/activejob/lib/active_job/railtie.rb:86-88` do.

In Rails those constants come from autoload (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer.rb:54-55`, `vendor/rails/v8.0.2/activejob/lib/active_job.rb:49-50`). trails#9919 dropped those autoloads, so the seats are now set only by explicit side-effect imports placed before boot:

- `packages/trailties/lib/generators/trails/app/templates/test/test-helper.ts.tt`, gated on `skipActionMailer` / `skipActiveJob`. Rails' `test_helper.rb.tt` has no such requires.
- `packages/trailties/test/support/isolation/abstract-unit.ts`. Rails' `abstract_unit.rb` has none.
- `packages/trailties/test/boot-app-test-help.trails.test.ts`.

They are needed because `onLoad` runs the block at once inside the railtie initializer when `IntegrationTest` is already loaded, and ESM has no synchronous load.

## Acceptance criteria

- [ ] The seats are reachable when the hook fires without any import in the generated `test_helper` or `abstract-unit.ts`. Candidate converged shapes: a testing namespace autoload reached before boot by the actionpack testing entry, or the actionmailer/activejob testing modules seated by a package testing entry that `IntegrationTest`'s load path already pulls in.
- [ ] The three side-effect imports added in trails#9962 are deleted, and `test-helper.ts.tt` matches `test_helper.rb.tt`.
- [ ] `server-path-closure.ts` stays green.
