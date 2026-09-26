---
title: "MissingTemplate details values inspect as Ruby Symbols"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8141
claim: "2026-09-26T10:17:09Z"
assignee: "missing-template-details-values-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

`MissingTemplate#initialize` renders `details.inspect`
(`actionview/lib/action_view/template/error.rb:63`). In Rails the details values
are Symbol arrays (`{:locale=>[:en], :formats=>[:html], :variants=>[], :handlers=>[:erb, ...]}`).

trails#7772 fixed the KEY spelling (`packages/actionview/src/template/error.ts:105`
now does `rbInspect(symbolizeKeys(details))`), but the VALUES trails passes are
bare strings: `packages/actionview/src/lookup-context.ts:411,447,508,533` and
`packages/actionview/src/renderer/partial-renderer.ts:113` build `{ ...details, formats: [format] }`
with `"html"`, so the message renders `:formats=>["html"]` where Rails renders `:formats=>[:html]`.

## Converged shape

Detail values that are Ruby Symbols carry the leading-colon spelling (CLAUDE.md
"A Ruby Symbol is a JS string" — `":html"`) wherever the details hash is built,
so `rbInspect` renders `[:html]` with no transform at the inspect site.

## Acceptance criteria

- A `MissingTemplate` message renders `with {:locale=>[:en], :formats=>[:html], ...}` exactly as Rails does.
- No per-site value transform in `error.ts`; the representation is fixed where details are built.
