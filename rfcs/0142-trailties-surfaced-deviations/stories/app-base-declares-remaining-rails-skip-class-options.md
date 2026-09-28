---
title: "AppBase declares the remaining Rails skip class options"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 6
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

# AppBase declares the remaining Rails skip class options

## Context

Rails' `AppBase` declares every skip flag as a `class_option` with `type: :boolean, default: nil`
(`railties/lib/rails/generators/app_base.rb:40-120`), including `skip_docker`, `skip_thruster`
(`:97-98`), `skip_brakeman` (`:103-104`), `skip_ci` (`:106-107`) and `skip_kamal` (`:109-110`),
each read by its own predicate (`:380-400`).

trails' `AppBase` (`packages/trailties/src/generators/app-base.ts`) declares only `skipEslint`
as a class option (trails#8205). The other flags live only in the
`skip${string}` index signature and the `Skip` union, and `skipDocker` is a hand-written
`AppGeneratorOptions` field plus a hand-written `--skip-docker` Commander flag in
`commands/new.ts`. So they carry no `desc`/`default: nil` and do not appear in the class-option
registry that `GeneratorBase.start` / `classOptionsHelp` read.

## Acceptance criteria

- Each Rails skip flag that trails has behaviour for is declared via `this.classOption(...)` in
  `AppBase`'s static block with Rails' `type`, `default: null` and `desc`, in Rails declaration order.
- `skipDocker` moves from `AppGeneratorOptions` onto the class option, and `create_dockerfiles`'
  `options[:skip_docker]` guard (`app_generator.rb:388-391`) reads it.
- Flags trails has no subsystem for (brakeman, kamal, thruster, ci) are declared only when the
  behaviour they gate is ported. Do not add inert options.
