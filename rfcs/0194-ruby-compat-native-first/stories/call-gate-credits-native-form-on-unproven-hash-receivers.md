---
title: "Call gate credits native hash forms on plain-object receivers Rails does not prove a Hash"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The call gate (`scripts/api-compare/compare.ts:336`, `extract-ts-api.ts`) credits a native form (`{ ...h, ...other }`, `Object.assign(h, other)`, `Object.hasOwn(h, "k") ? h.k : d`) only when the Ruby receiver is a proven Hash. A constant, a method's return value, `super`, an ivar or a reader receiver is never proven. So these plain-object sites keep the ruby-compat helper behind a `ruby-compat-native-required` disable whose only reason is the gate (trails#9346):

- `packages/actionpack/src/action-dispatch/testing/test-request.ts:20`: Rails `DEFAULT_ENV.merge(env)` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/test_request.rb`).
- `packages/activerecord/src/transactions.ts:450`: Rails `args.extract_options!.merge!(enforced_options)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:331`).
- `packages/actionpack/src/action-controller/test-case.ts` `paramsParsers`: Rails `super.merge @custom_param_parsers` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:180`).
- The `fetch` sites left on the helper for the same reason: `@config.fetch` in the abstract-mysql, postgresql and sqlite3 adapters; `ForeignKeyDefinition#validate?` / `defined_for?` `options.fetch(:validate, …)`; thor `LineEditor::Basic#echo?` and `Actions#apply`'s `config.fetch(:verbose, true)`.

## Acceptance criteria

- [ ] The gate credits the native form when the TS receiver is a plain object, using the TS type instead of Ruby receiver proof, or by another rule the RFC 0194 owner approves.
- [ ] The sites above converge to the native form, and their gate-only disables are removed.
- [ ] `parity:api:calls` and `parity:api:calls:args` stay green with no new rows.
