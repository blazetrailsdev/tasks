---
title: "default-middleware-stack-omits-rack-layer-and-flash"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DefaultMiddlewareStack#build_stack`
(`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:14-110`)
uses, among others: `Rack::Sendfile` (`:29`), `Rack::Runtime` (`:52`),
`Rack::MethodOverride unless config.api_only` (`:53`), `Rails::Rack::SilenceRequest` (`:57-59`),
`Rails::Rack::Logger` (`:61`), `ActionDispatch::Flash` (`:84`), `Rack::Head` (`:89`),
`Rack::ConditionalGet` (`:90`), `Rack::ETag, "no-cache"` (`:91`),
`Rack::TempfileReaper unless config.api_only` (`:93`), and the AR
`DatabaseSelector` / `ShardSelector` (`:95-107`).

trails' `packages/trailties/src/application/default-middleware-stack.ts:46-101`
omits all of those, although each Rack class is already ported
(`packages/rack/src/{sendfile,runtime,method-override,head,conditional-get,etag,tempfile-reaper}.ts`,
`packages/actionpack/src/action-dispatch/middleware/flash.ts`,
`packages/trailties/src/rack/logger.ts`).

Visible effects in a generated app (root README quickstart, PR #8195, `main` at `c19bfc0aee`):

- `POST /posts/1` with `_method=patch` answers 404. That breaks the scaffold's
  edit form and `buttonTo(..., { method: "delete" })`.
- There is no `Flash` middleware to commit the flash across a redirect.

## Acceptance criteria

- [ ] `buildStack` uses every middleware in `default_middleware_stack.rb:14-110`,
      in Rails' order and under Rails' conditions.
- [ ] A generated app honours `_method=patch|delete` on a POST.
- [ ] Anything that genuinely cannot be wired yet is split into its own story,
      with its Rails line.
