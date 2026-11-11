---
title: 'Use "the operator" wording outside CLAUDE.md'
status: draft
updated: 2026-11-11
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9992 renamed every reference to the repo owner in the CLAUDE.md files to "the operator". The task kept that PR to CLAUDE.md, so these occurrences still use the old wording:

- `docs/claude-md-decision-history.md`: 9 occurrences of "repo owner" (lines 37, 62, 315, 323, 329, 334, 355, 373, 440). CLAUDE.md points readers to this file for the history behind each ruling, so the two documents now disagree on the term.
- Parity reason strings: `scripts/parity/unported-files/actionview.ts:55,62,69` ("by repo-owner ruling") and `scripts/api-compare/naming-taxonomy.ts:140` ("Ruled permanent by the repo owner"). These feed generated parity output.
- `PERMANENT-SKIP:` comments:
  - `packages/actionview/test/actionpack/controller/render.test.ts:1150`
  - `packages/activestorage/test/controllers/direct-uploads-controller.test.ts:35,40,45`
  - `packages/activestorage/test/service/configurator.test.ts:23`

Leave other `Dean` matches alone. They are test fixture data (`name: "dean"`, `dean@example.com`, the `README.md:387` example).

## Acceptance criteria

- Each occurrence above reads "the operator" / "operator ruling".
- Regenerate any generated parity output that carries the reason strings.
- `grep -rn -i "repo owner\|repo-owner" --include=*.md --include=*.ts .` (excluding vendor and node_modules) returns nothing that refers to the person.
