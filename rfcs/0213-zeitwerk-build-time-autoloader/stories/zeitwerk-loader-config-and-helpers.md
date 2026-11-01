---
title: "Port Zeitwerk loader config, helpers, Cref and Registry"
status: in-progress
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-package-skeleton-and-inflector", "top-level-moves-to-ruby-compat"]
deps-rfc: []
est-loc: 550
priority: null
pr: trails#9571
claim: "2026-11-01T13:19:22Z"
assignee: "zeitwerk-loader-config-and-helpers"
blocked-by: null
closed-reason: null
---

## Context

Sources: `vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/config.rb`, `loader/helpers.rb`, `cref.rb`, `cref/map.rb`, `registry.rb`, `registry/explicit_namespaces.rb`. RFC 0213 § "`@blazetrails/zeitwerk`" and § "Seating". `Registry::Inceptions` is not ported.

## Acceptance criteria

- Config and helpers port at their names, including `cname_for`, `ls`, `walk_up`.
- `ruby?` answers `.ts` / `.js`, never `.d.ts`, a test file or an emitted twin; `ls` turns `-` into `_` before `camelize`.
- `Cref#set` is a plain property seat plus the classpath write, with `TopLevel` as `Object`.
- `test_ignore.rb`, `test_collapse.rb`, `test_push_dir.rb` and the `Cref` tests are ported.
