---
title: "activerecord: EnvironmentMismatchError carries Rails' message and its Rails.env arm"
status: done
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8611
claim: "2026-10-07T02:09:26Z"
assignee: "environment-mismatch-error-message-matches-rails"
blocked-by: null
closed-reason: null
---

## Context

`EnvironmentMismatchError` (`packages/activerecord/src/migration.ts`, class at the `ActiveRecord::EnvironmentMismatchError` name) builds a message that differs from Rails' (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:216-228`):

- Rails' fourth line is `"        bin/rails db:environment:set"`; trails emits `"        trails db environment:set"`.
- Rails has two arms: `if defined?(Rails.env)` it supers `"#{msg} RAILS_ENV=#{::Rails.env}\n\n"`, else `"#{msg}\n\n"`. trails has only the else arm.

trails#8602 converged the parent class and the sibling `ProtectedEnvironmentError` / `EnvironmentStorageError` messages (`migration.rb:207-235`) but left this one.

## Acceptance criteria

- [ ] The command line in the message is the trails spelling of `bin/rails db:environment:set` under the repo's token-rename conventions (docs/ruby-ts-conventions.md), decided once and matching what `trailties`' db command actually accepts.
- [ ] The `defined?(Rails.env)` arm is ported as a `TopLevel.Trails` read (CLAUDE.md "Call-time constant resolution"), appending the env assignment exactly where Rails does.
- [ ] `database-tasks-protected-environments-env.trails.test.ts` and `trailties/src/commands/db.test.ts` cover both arms.
