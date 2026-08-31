---
title: "Add trails new --name, restoring AppName#original_app_name's options[:name] arm"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 35
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AppName#original_app_name`
(`railties/lib/rails/generators/app_name.rb:12`) is
`options[:name] || File.basename(destination_root)` — the `--name` option
lets `rails new path/to/dir --name=my-app` name the app constant
independently of the directory. Exercised by
`railties/test/generators/app_generator_test.rb:1308-1311`
(`test_name_option`, asserting `config/application.rb` matches `/^module MyApp$/`).

PR #6534 ported the rest of the `AppName` chain
(`originalAppName`/`appName`/`appConstBase`/`appConst`/`isValidConst`) but
`AppGenerator` has no `--name` option, so `originalAppName()` in
`packages/trailties/src/generators/app-generator.ts` reads only the basename —
the `options[:name]` arm is dropped.

## Converged shape

Add the `--name` option to `trails new` (`packages/trailties/src/cli.ts` +
`AppGeneratorOptions`) and restore the Rails arm:
`return this.options.name ?? this.path.basename(this.destinationRoot);`

## Acceptance criteria

- `trails new <path> --name=my-app` generates `export class MyApp extends Application`.
- Rails' `test_name_option` is ported verbatim as `it("name option")`.
