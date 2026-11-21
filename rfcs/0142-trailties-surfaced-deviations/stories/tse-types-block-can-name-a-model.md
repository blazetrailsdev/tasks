---
title: "tse-types-block-can-name-a-model"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
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

A `<%! types: { post: ... } !%>` block's text is pasted verbatim into both
`.trails/views/posts/_post.html.tse.ts` and `.trails/template-registry-augmentation.d.ts`
(`packages/trails-tsc/lib/build-views.ts`, `registryMap` / `emitRegistryAugmentation`,
`localsParamType` in `lib/plugins/tse.ts`). The two files sit in different directories, so a
relative `import("../../models/post.ts")` resolves in at most one, and a bare `Post` is TS2304.
A partial's types cannot name an app model.

## Acceptance criteria

- A `types:` block can name an app model (e.g. an app-root-relative or package-style specifier
  rewritten per emitted file, or the registry importing the type from the stand-in).
- Regression test through `buildViews` + tsc with a partial typed by a model; fails on baseline.
