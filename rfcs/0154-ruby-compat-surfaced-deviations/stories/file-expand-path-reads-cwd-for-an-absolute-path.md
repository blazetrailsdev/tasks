---
title: "File.expandPath reads the working directory even for an absolute path"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`File.expandPath` (`packages/ruby-compat/src/file.ts`) ends in
`getPath().resolve(dirString ?? getFs().cwd(), fileName)`. With no `dir` argument it calls
`getFs().cwd()` before it knows whether `fileName` is absolute, so the working directory is
read for every call.

MRI's `rb_file_expand_path_internal` (`vendor/ruby/v3.3.11/file.c`) reads the working
directory only on the arm where the path is relative and no `dname` was given; an absolute
`fname` never reaches `getcwd`.

Surfaced by trails#8495: `Thor::Actions#destination_root=`
(`vendor/thor/v1.3.2/lib/thor/actions.rb:106-109`) calls `File.expand_path(root || "")`, and
`packages/trailties/src/generators/trails-actions.test.ts` runs against a fake `FsAdapter`
with no `cwd`. `File.expandPath("/app")` raised `getFs().cwd is not a function` there, and
the fake had to gain a `cwd` it never needed in Ruby terms.

## Acceptance criteria

- [ ] `File.expandPath` reads the working directory only when `fileName` is relative and no
      `dirString` is given, as `rb_file_expand_path_internal` does.
- [ ] A `.trails.test.ts` case expands an absolute path against an adapter whose `cwd` throws.
- [ ] The `cwd: () => "/"` added to the fake adapter in `trails-actions.test.ts` is removed.
