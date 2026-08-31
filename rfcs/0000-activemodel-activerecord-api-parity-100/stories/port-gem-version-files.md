---
title: "Give activemodel and activerecord the gem_version.rb file each package's last unported file is, moving gemVersion off deprecator.ts"
status: draft
updated: 2026-08-31
rfc: "0000-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activemodel
  - activerecord
deps: []
deps-rfc: []
est-loc: 90
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Both packages are one file short of file parity — activemodel 66/67,
activerecord 280/281 — and in both it is the same file: `gem_version.rb`.

Rails:
`vendor/rails/activemodel/lib/active_model/gem_version.rb` and
`vendor/rails/activerecord/lib/active_record/gem_version.rb`, each defining a
module-level `gem_version` returning `Gem::Version.new(VERSION::STRING)`.

trails ships the surface, in the wrong file: `gemVersion()` lives at
`packages/activemodel/src/deprecator.ts:15` and
`packages/activerecord/src/deprecator.ts:13`. activesupport already does it
correctly — `packages/activesupport/src/gem-version.ts:22-27`, re-exported from
`index.ts:442` — so this is one working sibling copied twice.

**This is not an `unported-files` row.** CONTRIBUTING.md admits such a row only
when the trails surface does not exist and is not intended to; here it exists
and ships. Recording it as unported would be the stale-row failure mode that
section exists to prevent.

## Acceptance criteria

- `packages/activemodel/src/gem-version.ts` and
  `packages/activerecord/src/gem-version.ts` exist, each holding `gemVersion`
  (and `VERSION` where the sibling has it), shaped after
  `activesupport/src/gem-version.ts`.
- `deprecator.ts` in each package imports the name rather than declaring it;
  no duplicate definition survives, and every existing caller still resolves.
- activemodel reaches **67/67 files**, activerecord **281/281 files** — the
  file-parity denominators for this RFC close here.
- activemodel `gem_version.rb` 1/1 and activerecord `gem_version.rb` 1/1.
- No `unported-files` row is added for either file.

## Definition of done

An `unported-files` row for `gem_version.rb` does not close this story. The surface exists and ships; a row would be the stale-registry failure mode CONTRIBUTING.md names.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api
```

Read the `files:` figure in both package summary lines.
