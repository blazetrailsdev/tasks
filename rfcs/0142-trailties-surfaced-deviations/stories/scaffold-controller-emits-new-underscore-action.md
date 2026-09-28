---
title: "Scaffold generators emit the new action as new_, so GET /posts/new 404s"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages: ["trailties"]
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

Found re-verifying the README quickstart (trails#8195) on `main` at `bace3edab4`.
In a `trails new --dev` app, `bin/trails generate scaffold_controller Post title:string body:text`
emits the `new` action as `async new_()`
(`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts:173`;
`scaffold/scaffold-generator.ts:101` does the same). The route maps `GET /posts/new` to
`posts#new`, and dispatch looks up `new`:

```text
GET /posts/new -> 404
AbstractController::ActionNotFound: The action 'new' could not be found for PostsController
```

Rails' template defines `def new` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt:15`).
`new` is a legal JS method name (`async new()` in a class body), and renaming the
emitted method to `new` in the generated app makes `/posts/new` dispatch.

## Acceptance criteria

- Both scaffold generators emit the action as `new`, and the invented `new_` spelling is gone.
- A generator test asserts `async new()`, and a dispatch test routes `GET /posts/new` to it.
