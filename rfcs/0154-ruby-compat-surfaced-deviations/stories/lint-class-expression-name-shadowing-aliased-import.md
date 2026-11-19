---
title: "Lint: a class expression named like an aliased import's original name (esbuild TDZ)"
status: done
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["actionpack", "rack-session", "activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10316
claim: "2026-11-18T20:51:31Z"
assignee: "lint-class-expression-name-shadowing-aliased-import"
blocked-by: null
closed-reason: null
---

## Context

esbuild produces code that throws at load (TDZ `ReferenceError`) for a static class-expression field
whose inner class name equals the original name of an aliased import:
`import { BacktraceCleaner as ActiveSupportBacktraceCleaner } ...;
static BacktraceCleaner = class BacktraceCleaner extends ActiveSupportBacktraceCleaner`.
esbuild renames the import back to `BacktraceCleaner`, which collides with the inner name.
The serverless spike fixed the three instances (`action-dispatch/routing/mapper.ts`,
`rack-session/lib/cookie.ts`, `activerecord/lib/migration/compatibility.ts`) by dropping the inner
name, since static-field NamedEvaluation keeps `.name`. Nothing stops a new instance.

## Acceptance criteria

- An ESLint rule (repo `eslint/` dir) reports a class expression whose name equals the
  original name of an import aliased in the same module.
- The rule is enabled repo-wide, reports zero instances on main, and has rule tests.
