---
title: "decide-fate-of-the-unconsumed-aot-views-manifest"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
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

`generated-app-cannot-render-its-own-views` asked, as one of its acceptance
criteria, that "the runtime resolves templates through the AOT manifest that
`trails-tsc-views build` writes, rather than ignoring it". That PR did NOT do
that, deliberately, and this story records the leftover decision.

The root cause of the 500 was not the unused manifest. Nothing had ever called
the port of `Handlers.extended` (`actionview/lib/action_view/template/handlers.rb:12-18`),
so `TemplateHandlers.extensions()` was `[]`, `PathParser#buildPathRegex`'s
handler union was `(?!)`, and every `.tse` file parsed with `handler === null` —
`FileSystemResolver#buildUnboundTemplate` dropped them all. Registering `raw`
and `tse` at the site Rails does (`template.rb:178`, `extend Template::Handlers`)
makes `FileSystemResolver` + `Template#compile!` + `Handlers::Tse` render the
`.tse` source at request time, which is the Rails path end to end. Rails has no
AOT manifest, so a resolver that imports `.trails/views/**.tse.js` is invented
surface with no Ruby counterpart.

So today `.trails/views-manifest.ts` and `.trails/views/*.tse.js` are still
written by `trails-tsc-views build` and still consumed by nobody at runtime;
their value is the typed shims + `template-registry-augmentation.d.ts`, which
are a build/editor concern, not a rendering one.

## Acceptance criteria

Decide, and then do one of:

- Keep the AOT output as a typecheck-only artifact. Say so in the RFC 0104
  README (which currently frames the AOT/runtime split as a gap), and drop
  `.trails/views/*.tse.js` + `views-manifest.ts` if the `.d.ts` shims are the
  only thing anyone reads.
- Or wire a production-mode resolver over the manifest, with an explicit
  `@noRailsEquivalent PERMANENT` receipt naming the Rails counterpart it has
  none of, and a benchmark showing it beats compiling from source.
