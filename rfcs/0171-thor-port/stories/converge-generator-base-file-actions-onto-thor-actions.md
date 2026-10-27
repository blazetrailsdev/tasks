---
title: "Converge GeneratorBase's hand-rolled file actions onto Thor::Actions and delete them"
status: in-progress
updated: 2026-10-27
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "port-thor-empty-directory-create-file-and-create-link",
    "port-thor-inject-into-file",
    "port-thor-file-manipulation-edits",
    "thor-actions-template-is-unported",
    "port-thor-directory-action",
  ]
deps-rfc: []
est-loc: 600
priority: 2
pr: trails#9391
claim: "2026-10-27T22:46:26Z"
assignee: "converge-generator-base-file-actions-onto-thor-actions"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Base` gets its file actions from `include Thor::Actions`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:18`). trailties' `GeneratorBase` carries its own synchronous copies:
`createFile` (`packages/trailties/src/generators/base.ts:840-873`), `emptyDirectory` (`:875-890`), `appendToFile`
(`:892-904`), `revokeInjection` (`:906-913`), `readFile` / `fileExists` / `removeFile`
(`:915-929`), and `getCreatedFiles` / `createdFiles` (`:150,931`). They are trails-only
surface, each marked `@noRailsEquivalent PERMANENT` or unmarked. Every generator calls them
synchronously.

## Acceptance criteria

- [ ] Those members are deleted. Call sites use Thor's `createFile` / `emptyDirectory` /
      `appendToFile` / `insertIntoFile` / `removeFile` / `template` / `copyFile` / `directory`
      and **await** them.
- [ ] Moved from `thor-actions-template-is-unported` (trails' sync `createFile` shadows Thor's,
      so `template` cannot run from a generator before this story):
      `TestUnit::Generators::ModelGenerator#create_test_file` / `#create_fixture_file`
      (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/model_generator.rb:15-17,21-25`)
      call `template "unit_test.rb", …` / `template "fixtures.yml", …` over `.tt` files, and the
      `@missingRailsCall template` receipts in
      `packages/trailties/src/generators/test-unit/model/model-generator.ts` are deleted. The
      private `template` copies in `packages/trailties/src/generators/app-generator.ts` and
      `packages/trailties/src/generators/rails/db/system/change/change-generator.ts` are deleted
      and their callers reach Thor's `template`.
- [ ] `getCreatedFiles` has no Rails counterpart. Tests that read it assert on the destination
      tree instead, as Rails' `assert_file` does (`Rails::Generators::Testing::Assertions`).
- [ ] `parity:api:extra --package trailties` drops by the deleted members, and
      `parity:api:calls` rows for `generators/base.rb` converge. Delete stale rows and
      `tighten`; no reseed.
