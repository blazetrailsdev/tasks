---
title: "Port Rake::Application option parsing and Rakefile loading"
status: ready
updated: 2026-10-29
rfc: "0211-rake-gem-port"
cluster: port
packages: [rake]
deps: [rake-dsl-and-file-tasks]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The first half of `vendor/rake/v13.2.1/lib/rake/application.rb` (847 lines): `init`, `handle_options` / `standard_rake_options`, `find_rakefile_location`, `raw_load_rakefile`, `load_imports`, `add_import`, `system_dir`, plus `default_loader.rb`, `rake_module.rb` (`Rake.application`, `Rake.load_rakefile`, `add_rakelib`) and `private_reader.rb`. A Rakefile or `rakelib/*.rake` is a TypeScript module loaded with an awaited `rbFLoad` (rake RFC § "A `.rake` file is a TypeScript module"); the default names become `Rakefile.ts` / `rakefile.ts` and `rakelib/*.ts`.

## Acceptance criteria

- [ ] Ported at the Ruby paths and names; option parsing accepts rake's documented switches.
- [ ] Rakefile lookup walks up directories as `find_rakefile_location` does.
- [ ] `test/test_rake_application.rb` (loading and option arms) and `test_rake_application_options.rb`, `test_rake_require.rb`, `test_private_reader.rb` port as native Vitest (`expect` and `@blazetrails/vitest-matchers`, per the rake RFC § "Tests are native Vitest"), names matching for `parity:test`.
