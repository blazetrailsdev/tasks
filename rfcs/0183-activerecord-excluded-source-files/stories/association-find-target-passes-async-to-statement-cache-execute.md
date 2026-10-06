---
title: "Association#find_target passes async: through to StatementCache#execute"
status: draft
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
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

Rails' `Association#find_target` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:247-275`)
takes `async: false` and passes it down: `sc.execute(binds, c, async: async)` (`:269`).
`StatementCache#execute` (`vendor/rails/v8.0.2/activerecord/lib/active_record/statement_cache.rb:145-156`)
then dispatches to `@model.async_find_by_sql` on the `async` arm.

trails#8594 ported the `async:` arm of `StatementCache#execute`
(`packages/activerecord/src/statement-cache.ts`), but no caller passes it. The one caller is
`_loadSingularViaStatementCache` (`packages/activerecord/src/associations.ts:428-475`), which calls
`sc.execute(binds, c, { allowRetry: true }, ...)`: no `async`, and an `allowRetry: true` Rails does
not pass at `association.rb:269`. `Association#findTarget`
(`packages/activerecord/src/associations/association.ts:394`) receives `{ async }` as `_options`
and ignores it.

Also in `execute`: the `this._queryBuilder instanceof PartialQuery` branch that calls `findBySql`
with empty binds has no counterpart in `statement_cache.rb:145-156`.

The native promise is the port of `ActiveRecord::Promise` (CLAUDE.md § "`ActiveRecord::Promise` is
the native promise"), so the arm answers a native promise; only the dispatch is in scope.

## Acceptance criteria

- [ ] `find_target`'s statement-cache call passes `async` through to `StatementCache#execute`, with
      the arguments `association.rb:269` passes.
- [ ] The `PartialQuery` branch in `StatementCache#execute` is converged onto
      `statement_cache.rb:145-156` or receipted with the reason it cannot be.
