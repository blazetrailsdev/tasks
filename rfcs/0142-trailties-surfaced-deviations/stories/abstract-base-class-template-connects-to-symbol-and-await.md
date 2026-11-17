---
title: "Generated abstract base class connectsTo passes a bare string and floats the promise"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract base class template
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/templates/abstract_base_class.rb.tt:5`)
writes `connects_to database: { writing: :animals }`: a Symbol, which `resolve_config_for_connection`
looks up as a named configuration.

trails' `packages/trailties/lib/generators/active-record/model/templates/abstract_base_class.ts.tt`
writes `this.connectsTo({ database: { writing: "animals" } })`. That has two problems:

- The value has no leading colon. A bare string is read as a URL, so boot fails with
  `InvalidConfigurationError: '{ development => animals }' is not a valid configuration`.
  Per CLAUDE.md "A Ruby Symbol is a JS string", the Symbol arm is `":animals"`.
- `connectsTo` is async and the template calls it inside a `static {}` block, so the promise
  floats (CLAUDE.md "Every promise has an owner").

Found in trails#10248, whose `boot-app-multi-db` fixture uses
`await AnimalsRecord.connectsTo({ database: { writing: ":animals" } })` at module level after
the class.

## Acceptance criteria

- [ ] The template emits `":<database>"` for the role value.
- [ ] The generated `connectsTo` call is awaited (module-level `await` after the class), with no floating promise.
- [ ] A generator test pins the emitted line, and a generated multi-db app boots with it.
