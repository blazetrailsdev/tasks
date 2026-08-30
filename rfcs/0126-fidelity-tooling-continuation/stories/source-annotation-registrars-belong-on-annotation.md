---
title: "Move the source-annotation registrars onto Annotation, where Rails declares them"
status: draft
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares `register_directories`, `register_tags` and `register_extensions`
as CLASS methods on the nested class
`Rails::SourceAnnotationExtractor::Annotation`
(railties/lib/rails/source_annotation_extractor.rb:78, :88, :98 — `Annotation`
opens at :71 as `class Annotation < Struct.new(:line, :tag, :text)`, nested
inside `class SourceAnnotationExtractor` at :21). They mutate `Annotation`'s own
registers — `directories`, `tags`, `extensions` — which are class-level state on
that class (:73-76).

trails hoists all three to FILE scope as top-level `export const` arrow
functions in `packages/trailties/src/source-annotation-extractor.ts:32-35`,
closing over module-level `directories` / `tags` / `extensions` arrays, while a
separate `export class Annotation` (:8) holds none of them.

Surfaced by PR #7238 (RFC 0126,
`extra-surface-nested-class-method-allowance-is-file-wide`): the extra-surface
scorer used to admit a nested Ruby class's method names FILE-wide, so top-level
functions in the same file absorbed `Annotation`'s allowance. Scoped to the
declaration that ports the nested class, they score as extra again — a
top-level function has no owner, so no scoped allowance can reach it. This is
the correct verdict: Rails puts the registrars and their state on one class, and
trails has split them across a class and three module-level arrays.

## Converged shape

`registerDirectories` / `registerTags` / `registerExtensions` become static
methods on `class Annotation`, over static registers on the same class,
mirroring source_annotation_extractor.rb:73-101. `registerExtensions`' block
parameter is Ruby's `&block` (:98) — the existing `ExtensionBuilder` callback
argument is already the settled trails spelling for it.

## Acceptance criteria

- The three registrars are static members of `Annotation` in
  `packages/trailties/src/source-annotation-extractor.ts`, with the registers
  they mutate held on the same class, at the Rails names.
- Call sites inside the file (`:48-51`, the built-in extension registrations)
  and any importer are updated.
- `pnpm parity:api:extra --package trailties` no longer lists
  `registerDirectories` / `registerExtensions` / `registerTags` on
  `source-annotation-extractor.ts`; trailties' total extras fall by 3.
- `pnpm parity:api --package trailties` delta is non-negative.
