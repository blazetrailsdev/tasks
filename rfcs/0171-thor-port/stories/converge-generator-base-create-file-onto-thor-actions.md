---
title: "converge-generator-base-create-file-onto-thor-actions"
status: done
updated: 2026-10-28
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - rebase-generator-base-onto-thor-group
deps-rfc: []
est-loc: null
priority: null
pr: trails#9403
claim: "2026-10-28T15:17:34Z"
assignee: "converge-generator-base-create-file-onto-thor-actions"
blocked-by: null
closed-reason: null
---

## Context

`converge-generator-base-file-actions-onto-thor-actions` deleted `GeneratorBase`'s
`readFile` / `fileExists` / `removeFile`. The rest of its scope could not land: every
`Thor::Actions` file action reports through `base.shell.sayStatus`
(`packages/thor/src/actions/empty-directory.ts:120-124`), and `GeneratorBase` has no
`Thor::Shell` until `rebase-generator-base-onto-thor-group` lands. Calling Thor's
`emptyDirectory` from `AppBuilder#cifiles` raises `Cannot read properties of undefined
(reading 'sayStatus')`. Rails gets them from `include Thor::Actions`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:18`).

Remaining trails-only members in `packages/trailties/src/generators/base.ts`: `createFile`,
`emptyDirectory`, `appendToFile`, `revokeInjection`, `getCreatedFiles` / `createdFiles`.
~100 `this.createFile` call sites, ~20 `run()`s returning `getCreatedFiles()`, and the
website's VFS `createFile` override (`packages/website/src/lib/frontiers/vfs-generator.ts`).
Note Thor's `createFile` reads its config only when it is a ruby-compat `Hash`
(`packages/thor/src/actions/create-file.ts:24`), so `{ mode: 0o600 }` callers need `perm:`
per Rails (`encryption_key_file_generator.rb:29`).

## Acceptance criteria

- [ ] Those members are deleted; call sites await Thor's `createFile` / `emptyDirectory` /
      `appendToFile` / `template` / `copyFile` / `directory`.
- [ ] `TestUnit::Generators::ModelGenerator#create_test_file` / `#create_fixture_file`
      (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/model_generator.rb:15-25`)
      call `template`; the private `template` copies in `app-generator.ts` and
      `rails/db/system/change/change-generator.ts` are deleted.
- [ ] Tests reading `getCreatedFiles` assert on the destination tree, as `assert_file` does.
- [ ] Split by LOC: this is ~1000+ LOC; ship in slices under the ceiling.
