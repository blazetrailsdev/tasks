---
title: "port-activesupport-deprecation-deprecators"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6256
claim: "2026-08-08T18:16:03Z"
assignee: "pg-adapter-test-aftereach-connect-hook-timeout"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Deprecation::Deprecators`
(`vendor/rails/activesupport/lib/active_support/deprecation/deprecators.rb:1-60`)
is unported: `grep -rn "class Deprecators" packages/activesupport/src` is empty
and the only mention is a comment at `railtie.ts:27`. It is app-facing API
(`Rails.application.deprecators`), not a Minitest helper, so it reads as a gap
rather than an `UNPORTED_FILES` entry.

PR #6240 registered the bucket in `NAME_COLLISION_CLUSTERS`
(`scripts/api-compare/compare.ts`) because its 10 methods are the delegating
setters `silenced=` / `behavior=` / `disallowed_behavior=` /
`disallowed_warnings=` / `debug=` / `silence` (`deprecators.rb:19-49`), spelled
exactly like `Deprecation`'s own, so the bucket falsely clustered onto
`activesupport/src/deprecation.ts` at 6/10 with zero ported. That registry row
is only-shrink: it leaves when this port lands.

## Converged shape

`packages/activesupport/src/deprecation/deprecators.ts` — a `Deprecators` class
with `@deprecators` hash, `[]`, `[]=`, `each`, and the five delegating writers
plus `silence`, method for method against `deprecators.rb:1-60`. Then delete the
`"activesupport:deprecation/deprecators.rb"` row from `NAME_COLLISION_CLUSTERS`.

## Acceptance criteria

- [ ] `deprecation/deprecators.rb` matches at 10/10 in `pnpm parity:api`.
- [ ] The `NAME_COLLISION_CLUSTERS` row is deleted.
