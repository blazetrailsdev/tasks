---
title: "Create @blazetrails/vite-ruby: ViteRuby, Config, Manifest and errors"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: vite
packages: [vite-ruby]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Core of the vite_ruby gem (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/`):

- `vite_ruby.rb:19-176`: the `ViteRuby` singleton, plus `instance`,
  `bootstrap`, `config`, `manifest`, `dev_server_running?` (`:86`) and
  `dev_server_connected?` (`:150`).
- `vite_ruby/config.rb:7-228`: `resolve_config` (`:135`), `config_defaults`
  (`:154`), `config_from_file` (`:187`) and `coerce_values` (`:100`). It reads
  `config/vite.json` over `vite_ruby/default.vite.json`.
- `vite_ruby/manifest.rb:12-241`: `path_for`, `resolve_entries`, `lookup!`,
  `vite_client_src` and `react_refresh_preamble`.
- `error.rb`, `missing_entrypoint_error.rb` and `missing_executable_error.rb`.

`builder.rb`, `build.rb`, `commands.rb`, `runner.rb`, `io.rb` and
`compatibility_check.rb` are `vite-ruby-builder-commands-runner`.
`ViteRuby#builder`, `#commands` and `#run` stay as accessors here, and
return those classes once that story lands.

`extract-ruby-api.rb` counts 118 public and 72 internal methods across the
gem. The upstream tests are in the monorepo's shared `vendor/vite_ruby/v3.11.1/test/`, among them
`config_test.rb`, `manifest_test.rb` and `mode_test.rb`, which this story
ports.

## Acceptance criteria

- `packages/vite-ruby/lib/` mirrors `vite_ruby/lib/vite_ruby/`, with
  `libEntryFile` `vite_ruby.rb`. Names come from the ruby-ts conventions table.
- Config precedence matches `resolve_config`: defaults, then the file, then
  `VITE_RUBY_*` env vars, then explicit attrs. Option keys are camelCase, the
  same as the JSON.
- `vendor/sources.ts`: `vite-ruby` gets `compareApi: true`. Test-compare
  splits the shared `test/` dir by assigning the vite_ruby files to this
  package, and `compareTests: true` is set for it.
- The ported tests keep their upstream names and use the gem's
  `test/test_app` fixture tree, copied verbatim.
