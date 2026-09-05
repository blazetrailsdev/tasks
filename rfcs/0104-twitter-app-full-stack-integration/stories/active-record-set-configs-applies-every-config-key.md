---
title: "active-record-set-configs-applies-every-config-key"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `active_record.set_configs` initializer
(`activerecord/lib/active_record/railtie.rb:295-336`) walks every key of
`app.config.active_record` and does `send("#{k}=", v)` onto
`ActiveRecord::Base` / `ActiveRecord`, so any framework default written into the
config hash reaches the runtime object.

trails' port
(`packages/trailties/src/trailties/active-record.ts`, initializer
`"active_record.set_configs"`) hand-lists five keys —
`maintainTestSchema`, `raiseOnAssignToAttrReadonly`,
`belongsToRequiredValidatesForeignKey`, `generateSecureTokenOn`, `queues` — and
drops the rest.

This surfaced while deleting the duplicate `loadDefaults` from
`trailties/active-record.ts` (story
`invented-statics-on-the-moved-framework-railties`): that invented function was
the only thing assigning `Base.partialInserts`.
`Application::Configuration#loadDefaults`
(`packages/trailties/src/application/configuration.ts:266`) correctly writes
`activeRecord.partialInserts = false` for 7.0 per
`railties/lib/rails/application/configuration.rb:263`, but `set_configs` never
reads it, so `Base.partialInserts` stays at its class default in a booted app.

## Acceptance criteria

- [ ] `active_record.set_configs` applies every key of the `activeRecord` config
      slot to its runtime target, the way `railtie.rb:295-336` does, rather than
      a hand-picked list.
- [ ] `config.load_defaults "7.0"` on a booted app leaves
      `Base.partialInserts === false`.
- [ ] `pnpm parity:api:calls` does not regress.
