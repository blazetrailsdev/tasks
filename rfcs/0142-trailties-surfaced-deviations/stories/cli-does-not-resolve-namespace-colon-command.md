---
title: "trails CLI does not resolve namespace:command (dev:cache, db:migrate) as Rails::Command.invoke does"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8150. That PR ported `DevCommand#cache` and changed the generated `development.ts` comment to Rails' wording: "Run trails dev:cache to toggle Action Controller caching."

trails' CLI (`packages/trailties/src/cli.ts`, commander) registers each Rails command namespace as a parent command with subcommands. The only spelling that works is `trails dev cache` (and likewise `trails db migrate`). `trails dev:cache` is an unknown command, so the generated comment tells users to run something that does not exist.

Rails resolves `namespace:command` in `Rails::Command.invoke` (`railties/lib/rails/command.rb:56-70`):

- `split_namespace` (`:125-137`) splits on `/^(.+):(\w+)$/`.
- `find_by_namespace` (`:90-99`) looks up `[namespace, "namespace:command"]` and their `rails:`-prefixed forms.
- An unmatched name falls through to `invoke_rake` (`:148-151`).

So `bin/rails dev:cache`, `bin/rails db:migrate` and `bin/rails credentials:edit` are the canonical spellings.

## Acceptance criteria

- `trails <namespace>:<command> [args]` dispatches to the same action as `trails <namespace> <command>`, via a port of `split_namespace` and `find_by_namespace` in `Rails::Command.invoke`'s shape.
- `trails dev:cache` toggles `tmp/caching-dev.txt`. A test covers it, alongside the ported `railties/test/commands/dev_test.rb`.
- `trails db:migrate` and `trails credentials:edit` resolve the same way.
