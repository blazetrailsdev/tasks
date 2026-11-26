---
title: "migrate-trailties-tests-off-the-ruby-compat-barrel"
status: done
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10804
claim: "2026-11-26T15:14:49Z"
assignee: "barrel-vi-mocks-target-owning-subpath"
blocked-by: null
closed-reason: null
---

## Context

`migrate-trailties-off-the-ruby-compat-barrel` moved `packages/trailties/lib` off the
ruby-compat barrel. `packages/trailties/test` still holds ~253 files importing
`from "@blazetrails/ruby-compat"` (about 1.4k changed lines when rewritten, over the
per-PR ceiling alongside lib). The generator templates under
`packages/trailties/lib/generators/**/templates/*.tt` keep the barrel on purpose: they are
generated application code.

## Acceptance criteria

- [ ] No `from "@blazetrails/ruby-compat"` import remains under `packages/trailties/test`
- [ ] Each binding moves to the subpath `scripts/boot-graph/scc-map.json` gives it; type-only groups become `import type`
- [ ] The touched test files pass
