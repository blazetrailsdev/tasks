---
title: "actiontext test helper boots the dummy app's initializers instead of hand-picking them"
status: done
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10159
claim: "2026-11-15T22:36:38Z"
assignee: "actiontext-test-helper-boots-dummy-app"
blocked-by: null
closed-reason: null
---

## Context

Rails' actiontext tests boot the dummy app through `require_relative "../test/dummy/config/environment"` (`vendor/rails/v8.0.2/actiontext/test/test_helper.rb:8`), so every railtie and engine initializer runs in order. That includes ActiveJob's `queue_adapter ||= (Rails.env.test? ? :test : :async)` (`vendor/rails/v8.0.2/activejob/lib/active_job/railtie.rb:57`) and ActiveStorage's `active_storage.configs` / `active_storage.verifier`.

trails' `packages/actiontext/test/test-helper.ts` hand-picks initializers instead. It runs five railties, then name-filters `ActiveStorageEngine.initializers` to `active_storage.configs` / `active_storage.verifier`, and `Engine.initializers` to `action_text.helper` / `action_text.renderer`. It also sets `ActiveJobBase.queueAdapter = "test"` and the blob service by hand (trails#10120). Each new test that touches another initializer adds one more hand step.

## Acceptance criteria

- The actiontext test helper boots the dummy `Application` through its initializer run (`app.initializeBang()` or the trails equivalent) with the ActiveJob, ActiveStorage and ActionText engines registered. There is no name-filtered initializer loop, and no hand-set `queueAdapter` or blob `services`.
- `controller-render.test.ts`, `content.test.ts` and the rest of `packages/actiontext/test` stay green on SQLite, PG and MariaDB.
