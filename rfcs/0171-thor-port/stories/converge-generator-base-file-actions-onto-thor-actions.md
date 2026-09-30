---
title: "Converge GeneratorBase's hand-rolled file actions onto Thor::Actions and delete them"
status: draft
updated: 2026-09-30
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
pr: null
claim: null
assignee: null
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
- [ ] `getCreatedFiles` has no Rails counterpart. Tests that read it assert on the destination
      tree instead, as Rails' `assert_file` does (`Rails::Generators::Testing::Assertions`).
- [ ] `parity:api:extra --package trailties` drops by the deleted members, and
      `parity:api:calls` rows for `generators/base.rb` converge. Delete stale rows and
      `tighten`; no reseed.
