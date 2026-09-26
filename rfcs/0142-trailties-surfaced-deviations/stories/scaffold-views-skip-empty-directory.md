---
title: "Scaffold writes views without empty_directory, so revoke leaves app/views/<plural>/ behind"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' ERB scaffold generator creates the views directory with
`empty_directory File.join("app/views", controller_file_path)`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/erb/scaffold/scaffold_generator.rb:13-14`).
Thor's `EmptyDirectory#revoke!` removes that directory, so
`scaffold_generator_test.rb:188-216` asserts `assert_no_file "app/views/product_lines"`.

trails' `ScaffoldGenerator#run` (`packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts`)
writes each view with `createFile` and has no `emptyDirectory` action. After `trails destroy
scaffold`, an empty `app/views/<plural>/` is left behind, and the port of
`scaffold on revoke` asserts an empty directory instead of an absent one.

The same run also has an invented `if (!fileExists(layout)) createFile(layout)` arm.
Rails' scaffold creates no application layout.

## Converged shape

- Port Thor's `empty_directory` onto `GeneratorBase` with both arms: create on invoke,
  `rm_rf` unless `pretend` on revoke.
- The scaffold's view step calls it before writing the views, as
  `erb/scaffold/scaffold_generator.rb:13-14` does.
- Drop the invented layout arm.

## Acceptance criteria

- `scaffold on revoke` asserts `app/views/product_lines` is absent.
- No layout is written by the scaffold generator.
