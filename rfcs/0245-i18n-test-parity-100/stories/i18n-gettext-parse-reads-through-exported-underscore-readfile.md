---
title: "i18n: Gettext#parse reads its .po through an exported _readFile instead of File.read"
status: blocked
updated: 2026-11-19
rfc: "0245-i18n-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-19T12:46:31Z"
assignee: "i18n-api-tests-port-localization-datetime-and-time"
blocked-by: "operator decision: every Ruby-named seam for File.read over the preloaded table adds surface. A File subclass of ruby-compat File in backend/base.ts (static read peeking fileContents) raises i18n extra-surface allowed mark 11->13 and invents an I18n::Backend::File constant (class-paths constant-residue stale); ruby-compat File.read itself is a sync fs read (async-fs rule) and can only be redirected by a global fs adapter swap. Needs a ruling on which shape (or a mark raise) is acceptable."
closed-reason: null
---

## Context

`I18n::Backend::Gettext#parse` reads the `.po` file with `::File.read(filename)`
(`vendor/i18n/v1.14.8/lib/i18n/backend/gettext.rb:46-48`). trails#10326 ported it as
`new PoParser().parse(_readFile(filename), new PoData())` in
`packages/i18n/lib/backend/gettext.ts`. `_readFile` is base's module-private
preloaded-file reader (`packages/i18n/lib/backend/base.ts`), the same one `loadYml` and
`loadJson` use. It was exported under a `_` prefix only so the extra-surface gate would
not count it. The `_` prefix is sanctioned only for `@perf` helpers (CLAUDE.md,
"Speed"), so this export is an invented, unreceipted name standing in for Ruby's
`File.read`.

The async-load rule (packages/i18n/CLAUDE.md, "A translation lookup is synchronous")
makes the read itself a synchronous peek of preloaded contents. That part is ratified.
The deviation is only the spelling and the export.

## Acceptance criteria

- [ ] `Gettext.parse` reads its file through a Ruby-named seam (`File.read` on a
      ruby-compat `File` backed by the preloaded table, or an equivalent ratified shape),
      not through an exported `_readFile`.
- [ ] `base.ts` stops exporting `_readFile`, and `loadYml` / `loadJson` read through the
      same seam.
- [ ] `packages/i18n/test/gettext/backend.test.ts` and
      `packages/i18n/test/backend/base.file-loading.trails.test.ts` still pass, and the
      i18n extra-surface marks do not grow.
