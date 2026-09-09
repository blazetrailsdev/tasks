---
title: "Packing a package with no files field now ships no type declarations at all"
status: draft
updated: 2026-09-09
rfc: "0100-package-size-and-publish-shape"
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

`files-field-for-leaf-packages` (this RFC) was filed on 2026-08-11 against a
tree where `dist/` was NOT gitignored: its evidence lists `dist` as present in
every one of the four tarballs and scopes the defect to 1.33 MB of `src/` and
`tsconfig.tsbuildinfo` bloat, at priority 3.

`.gitignore` gained `dist/` in `c832b9d838` (#7442). `pnpm pack` falls back to
`.gitignore` when a package has no `files` field and no `.npmignore`, so the
same missing field now has the OPPOSITE effect: those packages pack their
entry point and nothing else.

Measured at `2abafd85b8`, vendoring trails into trailmap:

```text
$ tar -tzf vendor/blazetrails-date-0.1.0.tgz | grep dist/
package/dist/index.js          # and that is all
```

against 76 `dist/` entries in the tarball packed at trailmap's `7cece02d`
pin. `index.d.ts`, every other `dist/*.js`, and all the `.map` files are gone.

Affected — every `packages/*` with no `files` field:

```text
packages/date/package.json
packages/did-you-mean/package.json
packages/globalid/package.json
packages/i18n/package.json
packages/ruby-compat/package.json     # not listed on the older story
```

`packages/website` also lacks it and is not published.

## Why this is not the story it looks like

It is a type-resolution break, not a size defect. A TypeScript consumer of a
packed `@blazetrails/date` gets no declarations at all:

```text
app/models/story.ts(27,31): error TS7016: Could not find a declaration file
for module '@blazetrails/date'.
```

trailmap hit exactly this. `bump-vendored-trails-for-testcase-request-bodies`
(0136-trailmap) was claimed, the pin bumped to `2abafd85b8`, and the bump had
to be backed out and the story released: trailmap cannot vendor trails at ANY
commit after #7442, which strands both fixes it wanted — the
`ActionController::TestCase` `body:` guard
(`packages/actionpack/src/action-controller/test-case.ts:354`) and the
`app/helpers` splice from #7558. Anything vendoring or publishing these
packages is blocked until this lands.

The packages that DO declare `"files": ["dist"]` — actionpack, activesupport,
activerecord, arel, trails-tsc, tse-compiler — pack correctly at the same
commit, which is what isolates the cause to the missing field rather than to
the build.

## Shape expected

`"files": ["dist"]` (plus NOTICE/LICENSE where present) on the five packages
above — the same change `files-field-for-leaf-packages` already asks for, so
whichever lands first should carry the other. What this story adds is the
severity, `ruby-compat`, and the acceptance criterion the older one cannot
have had:

## Acceptance criteria

1. Every published `packages/*` declares a `files` field; a test or lint rule
   fails when one does not, so a new package cannot repeat this.
2. For each packed tarball, `dist/index.d.ts` and the full `dist/` tree are
   present — asserted against the tarball, not against the working tree, since
   the working tree is exactly what disagreed here.
3. A consumer installing the packed tarballs typechecks. `trails new`'s own
   output is the natural harness; trailmap's `pnpm build` after
   `scripts/vendor-trails.sh` is the case that found it.
4. Whichever of this and `files-field-for-leaf-packages` lands second is
   closed rather than re-done.
