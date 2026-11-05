---
title: "trailties: config.annotations answers Annotation under the production entry"
status: draft
updated: 2026-11-05
rfc: "0212-trailties-port"
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

Rails' `config.annotations` is `Rails::SourceAnnotationExtractor::Annotation` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:563-565`), and `configuration.rb:9` requires `rails/source_annotation_extractor` eagerly, so an application may call `config.annotations.register_tags(...)` in any environment.

trails#9742 moved the extractor off the production graph, because it reaches `typescript/unstable/*`. `Configuration#annotations` (`packages/trailties/src/application/configuration.ts`) now reads the `Trails.SourceAnnotationExtractor` seat, which only the dev entry fills, through `bin.ts` importing `source-annotation-extractor.ts`. Under the production entry (`rackup config.ts`) the seat is empty, so an application whose `config/application.ts` calls `config.annotations.registerTags(...)` raises a `TypeError` at boot.

## Acceptance criteria

- [ ] `config.annotations` answers the `Annotation` class under the production entry, as `configuration.rb:563-565` does, with no static or string-literal edge from `index.ts`, `all.ts` or `server/index.ts` to `typescript` (`production-boot.trails.test.ts` stays green).
- [ ] Converged shape: `Annotation` and its registries (`directories`, `tags`, `extensions`, `register_*`; `source_annotation_extractor.rb:71-122`) are loadable without the TypeScript tokenizer. Only `ParserExtractor` (`:24-56`) awaits the compiler at `enumerate`, the way Rails rescues the missing `prism` / `ripper` (`:3-9`).
