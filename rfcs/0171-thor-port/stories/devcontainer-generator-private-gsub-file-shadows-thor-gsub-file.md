---
title: "devcontainer-generator-private-gsub-file-shadows-thor-gsub-file"
status: in-progress
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9746
claim: "2026-11-05T16:36:28Z"
assignee: "actionmailer-base-types-from-included-modules"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts:116` defines a
`private gsubFile(rel, re, replacement, enabled)`. It reads and writes the file synchronously and
prints its own `update` line. Because it sits on the class, it hides Thor's
`gsub_file` (`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`), which `GeneratorBase`
includes. This is why trails#9393's `route` reaches Thor's `gsubFile` through an explicit `.call`
and not through `this.gsubFile`.

Rails' devcontainer generator calls Thor's `gsub_file` directly
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb`).
Its `enabled` guard is a condition at the call site, not a parameter.

## Acceptance criteria

- [ ] The private `gsubFile` is deleted. Each call site is `if (cond) await this.gsubFile(path, flag, replacement)`
      on Thor's action, as the Rails generator writes it.
- [ ] `GeneratorBase` declares Thor's `gsubFile`, and `Rails::Generators::Actions#route` in
      `generators/actions.ts` calls `this.gsubFile` directly.
