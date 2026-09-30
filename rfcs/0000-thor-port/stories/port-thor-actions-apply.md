---
title: "Port Thor::Actions#apply over a template module (dynamic import in place of instance_eval), and route app:template through it"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-actions-module"]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions#apply(path, config)` (`vendor/thor/v1.3.2/lib/thor/actions.rb:216-233`) resolves `path` through
`find_in_source_paths` (unless it is an `http(s)://` URI), prints `apply`, reads the file (or
fetches it with `URI.open`), and **`instance_eval`s its Ruby source** against the generator,
indenting the shell by one level while it runs. `rails new -m template.rb` and
`rails app:template` reach it (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb`,
`apply_rails_template`; `railties/lib/rails/tasks/framework.rake`).

trailties already replaces `instance_eval` with a dynamic import:
`packages/trailties/src/commands/app.ts:6-25` imports the file and calls its default export
with a fresh `AppGenerator`.

## Design (RFC decision 7)

A template is a module whose default export takes the generator:
`export default async function (g) { ... }`. `apply` keeps Thor's body: it resolves the path
(`find_in_source_paths`, or an `http(s)` URL through ruby-compat's HTTP adapter written to a
temp file), prints `say_status :apply`, and indents while the template runs. Only the
evaluation changes: `instance_eval(contents, path)` becomes `(await import(url)).default.call(this, this)`.
Record that at the call site.

## Acceptance criteria

- [ ] `apply` reads complete in `parity:api --package thor`.
- [ ] `commands/app.ts`' hand-rolled import goes through `AppGenerator#apply`. The rake-task
      home of `app:template` is `move-app-template-command-onto-framework-rake-task`.
- [ ] `actions_spec.rb`'s `#apply` cases (7) are in `port-thor-actions-spec`. The two over a
      URI mock the HTTP adapter the way the spec's WebMock does.
