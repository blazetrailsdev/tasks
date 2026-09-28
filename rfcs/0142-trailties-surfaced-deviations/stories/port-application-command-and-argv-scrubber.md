---
title: "port-application-command-and-argv-scrubber"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

# Port ApplicationCommand and ARGVScrubber so VersionCommand delegates as Rails does

## Context

`Rails::Command::VersionCommand#perform`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/version/version_command.rb:6-8`) is
`Rails::Command.invoke :application, [ "--version" ]`. `ApplicationCommand#perform`
(`railties/lib/rails/commands/application/application_command.rb:27-30`) starts `AppGenerator`
with `ARGVScrubber.new(args).prepare!`, and `ARGVScrubber#handle_version_request!`
(`railties/lib/rails/generators/rails/app/app_generator.rb:641-647`) prints
`"Rails #{Rails::VERSION::STRING}"` and exits.

trails has no `application` command and no `ARGVScrubber`, so there is nothing for a ported
`VersionCommand#perform` (`port-help-and-version-commands-for-split-namespace`) to delegate to.
`new` (`packages/trailties/src/commands/new.ts`) is the trails entry to `AppGenerator`.

## Acceptance criteria

- `ARGVScrubber` (`prepare!`, `handle_version_request!`, `handle_invalid_command!`,
  `handle_rails_rc!`) is ported beside `AppGenerator`, and an `application` command runs
  `AppGenerator.start(new ARGVScrubber(args).prepareBang())`.
- `invoke("application", ["--version"])` prints `Trails <VERSION>` through
  `handle_version_request!`.
