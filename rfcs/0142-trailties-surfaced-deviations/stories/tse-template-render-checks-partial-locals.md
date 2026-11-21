---
title: "tse-template-render-checks-partial-locals"
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

Found 2026-11-20 building a scratch copy of `examples/cloudflare-worker`: a strict-locals
partial `app/views/posts/_post.html.tse` (`<%# locals: (post:) %>`) rendered from
`index.html.tse` as `render({ partial: "posts/post", locals: { item: post } })`.
After `trails-tsc-views build` + `tsc`, the call type-checks cleanly.

`.trails/template-registry-augmentation.d.ts` is correct (`"posts/post": { post: ... }`),
but the stand-in binds the free identifier `render` as
`let render = __lookup("render", true) as Scope<"render">`
(`packages/trails-tsc/lib/plugins/tse.ts`, `scopeLines` / `scopeTypes`), and
`Scope<"render">` resolves to `Bare<View["render"]>`, actionview `Base#render`
(`packages/actionview/lib/base.ts:322`), whose `options: RenderOptions | string | object`
accepts anything. The registry-checked signature on the stand-in's `RenderContext`
(`buildPreamble`) is never reached. The existing tests
(`test/plugins/render-conditional-generic.test.ts`, `tse.test.ts`) only check a `render`
declared on its own, never the full build pipeline.

## Acceptance criteria

- A template's bare `render({ partial, locals })` is checked against `TemplateRegistry`:
  wrong/missing locals for a strict-locals partial are a tsc error.
- Regression test runs the real pipeline (`buildViews` + a `ts` program over the emitted
  `.trails/**`) on a fixture app and fails on the baseline.
