---
title: "ConnectionAdapters.resolve's nonexistent-adapter message and register's parameter list differ from Rails"
status: ready
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
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

Rails' `ActiveRecord::ConnectionAdapters.resolve`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:33-40`)
raises `AdapterNotFound` with

    Database configuration specifies nonexistent '#{adapter_name}' adapter.
    Available adapters are: #{@adapters.keys.sort.join(", ")}.
    Ensure that the adapter is spelled correctly in config/database.yml and that you've added the necessary
    adapter gem to your Gemfile if it's not in the list of available adapters.

trails' `resolve` (`packages/activerecord/src/connection-adapters.ts`) ends the
message "adapter package to your package.json if it's not in the list of
available adapters." trails#8612 converged the two `LoadError` messages of the
same method to Rails' "gem" wording (`:46,52`) and left this one.
`RegistrationIsolatedTest` (`packages/activerecord/src/connection-adapters/registration.test.ts`)
asserts the trails wording, where Rails'
`test/cases/adapters/registration_test.rb` asserts the Gemfile one.

The same file's `register` takes a fourth `loader` parameter Rails'
`register(name, class_name, path = class_name.underscore)` (`:22-24`) does not
have, and no default for `path`.

## Acceptance criteria

- [ ] The `AdapterNotFound` message reads as `connection_adapters.rb:34-39`
      does, and the registration test asserts Rails' string.
- [ ] `register`'s parameter list is Rails', with `path` defaulting to
      `class_name.underscore`; the loader is derived from `path`, or the fourth
      parameter is receipted as the ESM-import language shortcoming.
