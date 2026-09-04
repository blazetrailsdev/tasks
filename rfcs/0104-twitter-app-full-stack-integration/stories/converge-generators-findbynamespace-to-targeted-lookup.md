---
title: "Normalize generator dir spellings and port the targeted Generators.lookup"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `find_by_namespace` calls the **targeted** `lookup(lookups)`
(`vendor/rails/railties/lib/rails/generators.rb:247`), which `require`s only the
candidate paths `namespaces_to_paths` derives
(`vendor/rails/railties/lib/rails/command/behavior.rb:36-53,67-80`), and reserves
the full-tree `lookup!` (`behavior.rb:56-65`) for `public_namespaces`
(`generators.rb:187-190`). PR #7368's port collapses both tiers into one:
`Generators.findByNamespace` (`packages/trailties/src/generators.ts`) calls
`Generators.lookupBang()`, the full-tree walk, and carries a
`@missingRailsCall lookup` receipt pointing here.

Two things block the targeted tier today:

- **No `inherited` hook.** Ruby's targeted `lookup` only has to `require` the
  file; Thor's `inherited` files the class into `subclasses`. The ESM port has
  to collect the class from the module's exports itself, which the walk already
  does — a targeted import needs the same collection step factored out.
- **The generator directory spellings are not derivable from the namespace.**
  `namespaces_to_paths` maps `rails:encrypted_file` to `rails/encrypted_file`,
  but the directory on disk is `generators/rails/encrypted-file/` while
  `generators/rails/scaffold_controller/` keeps the underscore, and the file
  inside is always dasherized (`scaffold-controller-generator.ts`). A targeted
  path cannot be computed without guessing both spellings per segment.

## Acceptance criteria

- The generator directory names under `packages/trailties/src/generators/rails/`
  use one spelling, so a namespace maps to exactly one path.
- `Generators.lookup(namespaces)` is ported over `namespaces_to_paths`
  (`behavior.rb:67-80`) and imports only the candidate paths.
- `findByNamespace` calls `lookup`, not `lookupBang`; `publicNamespaces` keeps
  calling `lookupBang`.
- The `@missingRailsCall lookup` receipt on `findByNamespace` is deleted.
