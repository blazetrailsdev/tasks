---
title: "Port Thor's spec helper and the Thor fixtures (script, enum, command, subcommand, help, verbose) plus the fixture file tree"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-dispatch-and-help"]
deps-rfc: []
est-loc: 600
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/spec/helper.rb` (88 lines) sets `THOR_COLUMNS=10000`, `$0 = "thor"`, `$thor_runner = true`
and `Thor::Base.shell = Thor::Shell::Basic`. It loads six fixtures and defines `capture(stream)`
(swapping `$stdout` / `$stderr`), `source_root`, `destination_root` and `silence_warnings`.
Every spec uses it.

Fixtures to mirror at `packages/trailties/src/thor/test-helpers/fixtures/` (excluded from
api-compare as test helpers), one TS module per `.thor` file, with Thor's class names as their
Ruby-name seats:

- `script.thor` (343 lines): `MyScript`, `AnotherScript`, `MyChildScript`, `Barn`,
  `PackageNameScript`, `Scripts::MyScript` / `MyDefaults` / `ChildDefault` / `Arities`,
  `Apple`, `Pear`, `MyClassOptionScript`, `MyOptionScript`, and the rest;
- `enum.thor`, `command.thor`, `subcommand.thor`, `help.thor`, `verbose.thor`,
  `exit_status.thor`.

And the data tree the action specs read: `doc/` (including `%file_name%.rb.tt`,
`config.yaml.tt`, `components/.empty_directory`, `excluding/`), `preserve/`, `app{1}/`,
`template/bad_config.yaml.tt`, `path with spaces`, `application.rb` and
`application_helper.rb`.

## Fidelity traps (predicted at authoring)

- [ ] **`.tt` bodies are ERB over Ruby.** They become TSE over JS
      (`<%= config[:foo] %>` → `<%= config.foo %>`). Keep file names and line structure, so a
      spec's expected output only changes where a Ruby expression's rendering does.
- [ ] **Fixture class bodies** use `desc` / `method_option` before each `def`. They become the
      explicit `methodAdded` shape (decision 1), which is the canonical example of it.
- [ ] **`capture(:stdout)`** swaps the ruby-compat stdout seat Shell::Basic writes through. It
      does not spy on `console.log`.

## Acceptance criteria

- [ ] Every fixture above exists, and each class answers its Ruby namespace
      (`MyScript.namespace() === "my_script"`, `Scripts::MyDefaults` → `default` where declared).
- [ ] The helper is a module the spec ports import, and the vitest setup for `src/thor/`
      applies its globals.
