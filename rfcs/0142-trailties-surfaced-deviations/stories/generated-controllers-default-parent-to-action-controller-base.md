---
title: "Generated controllers extend ActionController.Base, not ApplicationController"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8198
claim: "2026-09-27T23:04:27Z"
assignee: "engine-called-from-never-seated"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
A scaffolded controller renders its views without the application layout.
`GET /posts` on a fresh `trails new` + `generate scaffold Post` app returns the
bare `posts/index` template, with no `layouts/application` wrapper. Once the
controller is hand-edited to `extends ApplicationController`, the layout
applies.

- `emitControllerClass` defaults the parent to `ActionController.Base` when no
  `parent` is passed (`packages/trailties/src/generators/rails/controller/controller-paths.ts:63-76`,
  the fallback at `:69-71`).
- `ScaffoldControllerGenerator` (`scaffold-controller/scaffold-controller-generator.ts:45-53`)
  and `ScaffoldGenerator` (`scaffold/scaffold-generator.ts:44-51`) never pass a
  parent. `ControllerGenerator` passes one only when `--parent` is given
  (`controller/controller-generator.ts:23-31`).
- Rails: `ControllerGenerator` declares
  `class_option :parent, type: :string, default: "ApplicationController"`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/controller_generator.rb:9`),
  and the scaffold controller templates hard-code `< ApplicationController`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt:2`,
  `api_controller.rb.tt:2`).

The placeholder method bodies in the same controller (`// const posts = await Post.all();`)
are tracked separately by `resource-helpers-orm-class-orm-instance-unported`.
The scaffold `show` view's `<%= controller_name %>` ReferenceError is tracked by
`scaffold-views-diverge-from-rails-erb-templates`.

## Acceptance criteria

- The controller generator's `parent` option defaults to `ApplicationController`,
  and the emitted class imports it from `./application-controller.js` (adjusted
  for namespace depth).
- Both scaffold generators emit `extends ApplicationController`.
- Generator tests assert the parent. A boot-app test asserts that a scaffolded
  index renders inside `layouts/application`.
