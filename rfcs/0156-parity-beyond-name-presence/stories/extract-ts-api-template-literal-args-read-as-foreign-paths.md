---
title: "extract-ts-api records an interpolation-headed template-literal argument as a foreign absolute path"
status: draft
updated: 2026-10-29
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts` (`scripts/api-compare/extract-ts-api.ts:630-634`) serializes the
manifest and refuses to write it if `foreignAbsolutePath`
(`scripts/parity/shared-cache.ts:416`) finds an absolute source path outside the
worktree. The call-argument stream records a template literal with its interpolations
dropped. So Rails' `copy_file "#{__dir__}/templates/application_cable/channel.rb"`
(`vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/channel_generator.rb:43-46`),
ported literally as ``this.copyFile(`${__dir__}/templates/application_cable/channel.ts`)``,
is recorded as `/templates/application_cable/channel.ts`. The guard reads that as a
foreign absolute path, and every `parity:api*` run aborts. On trails#9387 the port had
to write `File.join(__dir__, "templates/…")` instead, which moved the source away
from Rails' interpolated-string shape only to satisfy the tool.

## Acceptance criteria

- The recorded argument for a template literal whose head is an interpolation does not
  read as an absolute path. Either keep a placeholder for each interpolated span (as the
  Ruby side's dstr is recorded), or have `foreignAbsolutePath` skip call-argument text.
- A regression test in `scripts/parity/` or `scripts/api-compare/` builds a manifest from a
  `` `${dir}/templates/x.ts` `` argument and asserts the write succeeds. The existing
  foreign-path tests (the PR #6964 namespace-import case) still fail as before.
- `ChannelGenerator#createSharedChannelFiles` returns to
  `` `${__dir__}/templates/application_cable/channel.ts` `` (and `connection.ts`).
