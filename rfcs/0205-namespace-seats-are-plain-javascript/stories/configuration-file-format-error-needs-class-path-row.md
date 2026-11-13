---
title: "configuration-file-format-error-needs-class-path-row"
status: draft
updated: 2026-11-13
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ConfigurationFile::FormatError`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:9-10`)
is defined in `packages/activesupport/lib/configuration-file.ts:12-20`, which
the package entry's graph does not reach (it is imported by subpath, from
`activerecord/lib/fixture-set/file.ts` and `solid-queue/lib/configuration.ts`).
So `pnpm parity:class-paths` writes no row for `ConfigurationFile` or
`FormatError`, and `rbModName(FormatError)` answers the bare `FormatError`
(checked on the built dist, 2026-11-13). Split out of
`seat-remaining-qualified-error-classes`.

## Acceptance criteria

- [ ] The class-path generator writes rows for `ActiveSupport::ConfigurationFile`
      and `ActiveSupport::ConfigurationFile::FormatError` (a subpath table, as
      `SUBPATH_ENTRIES` gives actionpack's `testing.ts`), with no `constSet` seat.
- [ ] A regression test asserts `rbObjClassname(new FormatError())` is
      `ActiveSupport::ConfigurationFile::FormatError`.
