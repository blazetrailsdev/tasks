---
title: "activestorage test setup boots the full ActiveRecord railtie"
status: done
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9714
claim: "2026-11-04T16:06:25Z"
assignee: "activestorage-fixture-set-test-names"
blocked-by: null
closed-reason: null
---

## Context

Rails' activestorage dummy app (`vendor/rails/v8.0.2/activestorage/test/dummy/config/application.rb`) boots every framework railtie, the ActiveRecord railtie included (`activerecord/lib/active_record/railtie.rb`).

trails' `packages/activestorage/src/test-helpers/database/setup.ts` (trails#9710) runs these railties' initializers:

- ActiveSupport
- GlobalID
- ActionView
- ActionController
- the activestorage Engine

From the ActiveRecord railtie it runs only `active_record.set_executor_hooks`, filtered by name. The full railtie's `active_record.initialize_database` needs a `config/database.yml` the setup does not provide; it configures the connection by hand with `Base.configurations` / `connectsTo`.

## Acceptance criteria

- The setup runs the whole ActiveRecord railtie, as the dummy app does. Either give the dummy a `config/database.yml` (or the trailties equivalent) naming the activestorage databases, or drive `initialize_database` from the configurations the setup already builds.
- The name filter on `ActiveRecordRailtie.initializers` is removed.
- `packages/activestorage/src` tests stay green.
