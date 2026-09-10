---
title: "ExceptionWrapper's four tables are module-private, not cattr_accessors the railties merge into"
status: draft
updated: 2026-09-10
rfc: "0141-actionpack-surfaced-deviations"
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

Surfaced by trails#7677. Rails declares ExceptionWrapper's four tables as
`cattr_accessor`s (`vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:12-46`),
and the railties merge into them:
`actionpack/lib/action_dispatch/railtie.rb:71`
(`ExceptionWrapper.rescue_responses.merge!(config.action_dispatch.rescue_responses)`),
fed by `activerecord/lib/active_record/railtie.rb:23-28`
(`ActiveRecord::RecordNotFound => :not_found`, `StaleObjectError => :conflict`,
`RecordInvalid`/`RecordNotSaved => :unprocessable_entity`).

trails' `packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`
holds `rescueResponses`, `rescueTemplates`, `wrapperExceptions`,
`silentExceptions` as module-private consts, so nothing can merge into them —
a raised `ActiveRecord::RecordNotFound` answers 500 where Rails answers 404.

## Converged shape

`classAttribute()` (activesupport) for each of the four on `ExceptionWrapper`,
Rails names, same defaults; the `Hash.new(:internal_server_error)` default kept
in `statusCodeForException`. Port the railtie merge sites
(`action_dispatch/railtie.rb:18,71`, `active_record/railtie.rb:23`).

## Acceptance criteria

- [ ] The four tables are class attributes named `rescueResponses`, `rescueTemplates`, `wrapperExceptions`, `silentExceptions`.
- [ ] ActiveRecord's four rescue_responses entries are merged in; a raised `ActiveRecord::RecordNotFound` wraps to 404.
- [ ] parity:api deltas non-negative; extra gates green.
