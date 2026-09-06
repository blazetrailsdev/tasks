---
title: "trails server is hardcoded to development and ignores the environment"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails server` has no concept of an environment. It is hardcoded to
development, so a deployed application cannot be served in production by the
command Rails uses to serve it.

`packages/trailties/src/commands/server.ts:9-40` takes exactly two options,
`--port` and `--binding`. There is no `-e` / `--environment`, nothing reads
`TRAILS_ENV` or `NODE_ENV`, and the banner is the literal string
`=> Trails application starting in development` (`:26`, and again in
`server/dev-server.ts:56`). The branch that follows is on file existence, not
environment: if `vite.config.ts` is present (`hasViteConfig`, `:44-51`) the
command starts `DevServer` — a Vite dev server with HMR, watching the project
tree — and otherwise runs the plain Node handler. A production deployment with
a `vite.config.ts` therefore gets HMR and a file watcher.

Rails' counterpart is
`railties/lib/rails/commands/server/server_command.rb`. It declares
`--environment` (`:108` area, via `Rails::Command::EnvironmentArgument`),
resolves it with `def environment` = `options[:environment] || Rails::Command.environment`
(`:227-229`), and — importantly — applies it _before_ the application is
required, `set_environment` doing `ENV["RAILS_ENV"] ||= options[:environment]`
(`:28-29`) with the comment at `:137-138` explaining that the app is required
after the server sets the environment so the option propagates. The
environment also selects defaults: the binding is `localhost` in development
and `0.0.0.0` otherwise (`:221`), and `:64` branches on
`options[:environment] == "development"`.

**Found by trailmap in production.** The dokku app sets `NODE_ENV=production`
both in `dokku config` and in its Dockerfile, and its `CMD` is
`trails server -b 0.0.0.0 -p 8080`. The running container logs
`=> Trails application starting in development` and
`=> Vite dev server with HMR enabled`. The deployed application has been
serving from the dev server, with a Vite file watcher inside the container,
since the first deploy.

This is suspected to contribute to an availability problem there — the
container is repeatedly terminated by SIGTERM (exit 143) with no application
error, on a host where `systemd-oomd` is active, and a watching dev server is
a much larger and more memory-hungry process than the production handler — but
that link is unconfirmed and is not what this story has to prove. The
environment bug stands on its own.

## Acceptance criteria

- `trails server` accepts `-e` / `--environment` and resolves the environment
  the way `server_command.rb:227-229` does, falling back to the command's
  environment rather than to a constant.
- The environment is applied before the application is required, mirroring
  `set_environment` (`server_command.rb:28-29`) and the comment at `:137-138`,
  so the value propagates into the booting app.
- Choosing the dev server is a decision about the environment, not solely
  about whether `vite.config.ts` exists: a production run serves through the
  Node handler with no HMR and no file watcher, with a `vite.config.ts`
  present.
- The startup banner reports the environment actually in effect rather than
  the literal `development`.
- Covered by a test that boots the command with the environment set to
  production and asserts no dev server is started.
