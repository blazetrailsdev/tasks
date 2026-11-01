---
title: "port-rails-generator-usage-files"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

# Port the Rails generator USAGE files

## Context

`GeneratorBase.desc` (`packages/trailties/src/generators/base.ts`) now reads a generator's USAGE file, as `vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:39-49` and `usage_path` (`:215-221`) do. Rails ships 15 USAGE files under `railties/lib/rails/generators/`; trails has only `generators/rails/channel/USAGE`, so every other generator prints the fallback "Create ... files for ... generator." text.

`desc` reads the file as plain text: Rails' `ERB.new(...).result(binding)` has no runtime form under CLAUDE.md § "Templates are precompiled", and no Rails USAGE file contains an ERB tag.

## Acceptance criteria

- [ ] Each Rails USAGE file for a ported generator exists beside that generator, with paths, commands and names translated to trails (`bin/trails`, kebab-case file names, `.ts`).
- [ ] `trails g <name> --help` prints that text for each.
