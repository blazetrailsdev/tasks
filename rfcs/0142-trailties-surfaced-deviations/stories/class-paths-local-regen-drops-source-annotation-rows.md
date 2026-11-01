---
title: "class-paths regenerate drops SourceAnnotationExtractor rows locally but not in CI"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On trails#9561, `pnpm parity:class-paths` run locally dropped three rows from
`packages/trailties/src/class-paths.generated.ts`: `ParserExtractor`, `Parser`
and `PatternExtractor` (`Rails::SourceAnnotationExtractor::*`, Ruby
`railties/lib/rails/source_annotation_extractor.rb:24`). The classes are exported
from `packages/trailties/src/source-annotation-extractor.ts`, and the same local
`--check` failed on main's table, even after `API_COMPARE_FORCE=1 pnpm parity:api`
(which exited 1). CI's `class-paths.ts --check` accepts main's table and rejects
the local output. The cause was not found.

## Acceptance criteria

- The cause of the local/CI difference in `scripts/api-compare/class-paths.ts` is identified.
- A local regenerate and check produce the same table as CI for a clean main checkout.
