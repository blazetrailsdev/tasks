---
title: "trails new should generate an app that subclasses Trailties.Application"
status: done
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps:
  - boot-app-through-trailties-application
deps-rfc: []
est-loc: null
priority: null
pr: 6534
claim: "2026-08-14T18:17:40Z"
assignee: "generate-app-subclassing-application"
blocked-by: null
closed-reason: null
---

## Context

`trails new` generates a `config/application.ts` that has nothing to do with
`Trailties.Application`. A freshly generated app cannot boot the framework.

Generated output (`examples/twitter-app/src/config/application.ts`, produced
verbatim by `node packages/trailties/bin/trails.js new twitter-app`):

```ts
import { ActiveRecord } from "@blazetrails/activerecord";
import { ActiveSupport } from "@blazetrails/activesupport";
import databaseConfig from "./database.js";
import { drawRoutes } from "./routes.js";

export const app = {
  name: "twitter-app",
  config: { database: databaseConfig },
  routes: drawRoutes,
};
```

A plain object literal. Both `ActiveRecord` and `ActiveSupport` are imported
and unused. The template lives in
`packages/trailties/src/generators/app-generator.ts`.

Rails' equivalent
(`vendor/rails/railties/lib/rails/generators/rails/app/templates/config/application.rb.tt`):

```ruby
module <%= app_const_base %>
  class Application < Rails::Application
    config.load_defaults <%= Rails::VERSION::STRING.to_f %>
    ...
  end
end
```

Related: the generated `src/config/routes.ts` types its parameter as `any`
(`export function drawRoutes(router: any): void`) and its body is a comment,
where Rails emits `Rails.application.routes.draw do ... end`.

## Acceptance criteria

- `trails new` emits a `config/application.ts` whose default export is a
  subclass of `Trailties.Application`, registered via `Application.register`.
- No unused imports in generated files.
- `drawRoutes` is typed against `Mapper` from `@blazetrails/actionpack`, not
  `any`.
- `config.ts` at the app root boots that class the way `config.ru` boots
  `Rails.application`.
- A generator test asserts the emitted app subclasses `Application`.
- Depends on the Finisher splice and the boot convergence stories.
