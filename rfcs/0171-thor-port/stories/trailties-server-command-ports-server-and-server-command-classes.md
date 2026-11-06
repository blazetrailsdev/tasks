---
title: "trailties-server-command-ports-server-and-server-command-classes"
status: done
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - port-rackup-server-for-rails-server
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9727
claim: "2026-11-06T20:47:37Z"
assignee: "trailties-env-helpers-with-rails-env-and-rack-env"
blocked-by: null
closed-reason: null
---

## Context

Rails splits `bin/rails server` across two classes in
`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb`:
`Rails::Server < Rackup::Server` (`:17-95`: `start`, `log_to_stdout` at `:75-85`, `wrapped_app`, ...) and
`Rails::Command::ServerCommand` (`:97-280`: `perform`, `server_options`, `log_to_stdout?` at `:239-243`, `host`, `environment`, ...).

trails' `packages/trailties/src/commands/server.ts` is a commander `serverCommand()` function with module-level
helpers carrying those Rails names (`logToStdout`, `isLogToStdout`, `host`, `environment`), so a Rails reader
looking for `Rails::Server#log_to_stdout` finds a free function, and `log_to_stdout` relies on running after
`Trails.initialize()` where Rails touches `wrapped_app`.

## Acceptance criteria

- `Server` (start / log_to_stdout / wrapped_app) and `ServerCommand` (perform / server_options / log_to_stdout? / host / environment) exist as classes at their Rails names, and `serverCommand()` dispatches to them.
- `Server#logToStdout` calls `wrappedApp()` first, as `server_command.rb:76` does.
