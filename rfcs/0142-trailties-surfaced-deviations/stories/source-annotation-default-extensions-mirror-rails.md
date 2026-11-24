---
title: "Source annotation default extensions mirror Rails' register_extensions calls"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
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

`packages/trailties/lib/source-annotation-extractor.ts` `registerDefaults` registers `"scss", "sass", "less"` with the `//` pattern, and registers `ts`/`mjs`/`cjs`/`tsx`/`jsx` beside `js`. Rails 8.0.5.2 registers exactly `builder rb rake ruby`, `yml yaml`, `js` (`//`), `css` (`/* */`), `erb` (`vendor/rails/v8.0.5.2/railties/lib/rails/source_annotation_extractor.rb:102-120`). trails#10684 converged `css` onto the block-comment pattern, but kept the scss/sass/less registration, which Rails has only as a doc-comment example (`:96`).

## Acceptance criteria

- [ ] The default registrations mirror `source_annotation_extractor.rb:102-120` one call per Rails call, with the token renames from docs/ruby-ts-conventions.md (`rb` → `ts`, `erb` → `tse`). Each extension Rails does not register is deleted, or receipted where a TS source extension makes it necessary.
- [ ] The annotation tests in `packages/trailties/test/source-annotation-extractor*.test.ts` that read `.scss`/`.sass`/`.less` are realigned with Rails' tests.
