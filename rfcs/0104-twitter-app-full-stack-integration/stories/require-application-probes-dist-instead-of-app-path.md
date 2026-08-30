---
title: "require-application-probes-dist-instead-of-app-path"
status: draft
updated: 2026-08-30
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`requireApplicationBang` (`packages/trailties/src/command/actions.ts:14-29`,
landed by #7262) probes two spellings of the application file and prefers the
built one:

```ts
for (const candidate of [
  p.join(root, "dist", "config", "application.js"),
  p.join(root, "config", "application.ts"),
]) { ... }
```

Rails has one spelling and no loop: `Rails::Command::Actions#require_application!`
(`railties/lib/rails/command/actions.rb:13-16`) is

```ruby
def require_application!
  require ENGINE_PATH if defined?(ENGINE_PATH)
  require APP_PATH if defined?(APP_PATH)
end
```

— two constants, each required at most once, no filesystem probing and no
`dist/` notion. The `dist`-first arm is trails' own: a generated app compiles
`config/application.ts` to `dist/config/application.js`, and the command prefers
the build when one exists.

The `ENGINE_PATH` arm is also absent — trails has no engine-root equivalent
wired into the CLI yet.

## Converged shape

`require_application!` resolves the application module the way Rails resolves
`APP_PATH` — one path, decided by the caller/CLI entry point rather than
discovered by probing — and gains the `ENGINE_PATH` arm when trails has an
engine root to name. Candidate: have `bin/trails` / `createProgram` compute the
app path once (Rails' `bin/rails` defines `APP_PATH` there) and hand it to the
command layer, so `require_application!` does a single import.

Note `#7262` deliberately shrank this from three candidates to two by deleting
the `src/config/application.ts` arm; the remaining `dist` arm is the last one.

## Acceptance criteria

- `requireApplicationBang` imports one resolved application path, with no
  filesystem probe loop.
- Whatever decides between the built and source spelling lives where Rails puts
  it (the CLI entry point defining `APP_PATH`), not inside the ported method.
- `ENGINE_PATH` arm ported, or its absence recorded with the Rails line and the
  trails blocker.
