---
title: "ActionMethods lacks inside/chmod/shebang delegates (Thor inside/chmod unported)"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionMethods` (`railties/lib/rails/generators/rails/app/app_generator.rb:7-27`) delegates nine
actions to the generator: `template copy_file directory empty_directory inside
empty_directory_with_keep_file create_file chmod shebang`. trails' `ActionMethods`
(`packages/trailties/src/generators/app-generator.ts`) delegates `template`, `emptyDirectory`,
`emptyDirectoryWithKeepFile` and `createFile`, and forwards everything else through its
`method_missing` Proxy.

The rest have no generator target:

- `inside` (thor-1.3.2 `lib/thor/actions.rb:170-199`): needs a `@destination_stack` on `GeneratorBase`
  (today one `cwd` field) and `FileUtils.cd` with a block in ruby-compat.
- `chmod` (thor-1.3.2 `lib/thor/actions/file_manipulation.rb:145-153`): needs `FileUtils.chmod_R` in ruby-compat.
- `copy_file` / `directory` need Thor source paths: story
  `generators-have-no-thor-source-paths-or-template-files`.
- `shebang` is defined nowhere in Rails 8.0.2 or Thor 1.3.2, so Rails' own delegate is dead. Port it as a
  delegate only.

## Converged shape

Port `inside` and `chmod` as Thor actions on `GeneratorBase`, with the ruby-compat `FileUtils.cd` /
`FileUtils.chmodR` they need, and add their `ActionMethods` delegates plus `shebang`.

## Acceptance criteria

- `ActionMethods` has delegates for `inside`, `chmod` and `shebang`. With the source-paths story, it has all nine.
- `inside("dir") { … }` scopes generated paths to `dir` and restores the destination root afterwards,
  including when the block returns a promise.
