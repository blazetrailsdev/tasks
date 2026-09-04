---
title: "FileUtils.copy_file is module-private in trails and public in Ruby — promote it so uploaded-file ports can call it"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7472
claim: "2026-09-04T02:36:29Z"
assignee: "expose-fileutils-copy-file-as-a-public-member"
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.copy_file` is not reachable. `packages/ruby-compat/src/file-utils.ts`
has it — `function copyFile(src, dest, preserve = false)` at `:192`, citing
`vendor/ruby/lib/fileutils.rb:1076-1080` — but it is a **module-private
function**, used only by `cp` (`:211`) and `cp_r`'s entry walk (`:297`). The
public `FileUtils` class (`:251`) exports `mkdirP`, `makedirs`, `cp`, `mv`,
`rm`, `rmF`, `rmR`, `removeEntry`, `removeFile` and `touch`, but not
`copyFile`.

In Ruby it is public: `FileUtils.copy_file` is a documented module function,
distinct from `cp` in that it copies contents only and never recurses.

Surfaced by RFC 0137-rack-test-gem-port:
`Rack::Test::UploadedFile#initialize_from_file_path` calls
`FileUtils.copy_file(path, @tempfile.path)`
(`vendor/rack-test/lib/rack/test/uploaded_file.rb:95`), so
`port-rack-test-uploaded-file` has no receiver for the call Rails makes and
would land a `call-mismatches-exclude` row or reach for `cp` — a different
Ruby method.

Prior art checked: RFC 0135's `fileutils-arrives-as-a-ruby-class` (`status:
done`, PR #7426) is what created the class and its member list, and
`fileutils-copy-metadata-loses-atime-and-the-symlink-arms` covers `copy_entry`
metadata arms. Neither promotes `copy_file`. This is a small residual of that
work, filed here rather than there because 0135 is about the platform adapters
and this is a member-surface fix.

## Acceptance criteria

- [ ] `FileUtils.copyFile` is a public static, keeping the existing body and its
      `fileutils.rb:1076-1080` citation; `cp` and `cpR` call the same seat, not
      a second copy.
- [ ] `pnpm parity:api --package ruby-compat` scores it against
      `FileUtils.copy_file`; `pnpm parity:api:extra:gate` green (ruby-compat is
      pinned at `novel` 0, so it must score, not carry a receipt).
- [ ] Ruby's `preserve` argument keeps its name and default.
