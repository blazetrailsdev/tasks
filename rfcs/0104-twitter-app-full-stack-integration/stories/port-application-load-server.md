---
title: "Port Application#loadServer and emit it from the generated config.ts"
status: in-progress
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: ["generate-app-subclassing-application"]
deps-rfc: []
est-loc: 90
priority: 9
pr: 7305
claim: "2026-08-31T17:10:47Z"
assignee: "wire-implicit-render-into-controller-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Rails' `config.ru` is two statements
(`railties/lib/rails/generators/rails/app/templates/config.ru.tt:5-6`):

```ruby
run Rails.application
Rails.application.load_server
```

`trails new` emits only the `run` half (`export default Trails.application;`)
because `Application#load_server`
(`railties/lib/rails/application.rb:414` — `def load_server; ...` requiring
`config/server.rb` if present) is not ported; grepping
`packages/trailties/src` finds no `loadServer`. See PR #6534, which lists this
as a deliberate omission.

## Converged shape

Port `Application#loadServer` per `application.rb:414` (loading the app's
`src/config/server.ts` when present, the trails spelling of `config/server.rb`),
and emit the call from the generated root `config.ts` so both statements of
`config.ru.tt` have counterparts.

## Acceptance criteria

- `Application#loadServer` exists with Rails' control flow.
- Generated `config.ts` calls it after exporting the application.
- A test covers a generated app with and without `src/config/server.ts`.
