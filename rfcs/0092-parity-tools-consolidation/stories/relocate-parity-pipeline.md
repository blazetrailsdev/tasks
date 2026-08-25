---
title: "Relocate the SQL parity pipeline under scripts/parity/pipeline/"
status: done
updated: 2026-08-08
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6255
claim: "2026-08-08T18:04:01Z"
assignee: "connection-handler-is-connected-adapter-unique-flake"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity` (`@blazetrails/parity`) currently _is_ the SQL
parity-pipeline runner: `run.ts`, `canonical/`, `fixtures/` (200+ fixture
dirs), `query/`, `schema/`, `translate/`. The RFC makes this package the
umbrella for all Rails-parity tooling with the shared compare core at its
heart, so the pipeline moves out of the way first:

- `git mv` the runner contents under `scripts/parity/pipeline/`
  (`pipeline/run.ts`, `pipeline/canonical/`, `pipeline/fixtures/`, ...).
- Rename package.json scripts: `parity:schema` → `parity:pipeline:schema`,
  `parity:query` → `parity:pipeline:query`, `parity:validate` →
  `parity:pipeline:validate` (root `package.json:59-61`). A later story
  repurposes the freed `parity:schema` name for schema-compare — land this
  rename first.
- Update the `scripts/parity/...` path references in
  `.github/workflows/ci.yml` (~15 hits: vitest filters at :521/:539/:716,
  gem cache keys and working-directory at :1495-1506, `run.ts` invocations at
  :1510/:1532, artifact paths `scripts/parity/.out/...`).
- Check `scripts/parity/query/node` / `schema/node` for intra-package
  relative paths (fixture dirs, `.out/` output roots) that encode the old
  layout.

Move-only: no behavior change, no symbol renames.

## Acceptance criteria

- `pnpm parity:pipeline:schema` / `parity:pipeline:query` /
  `parity:pipeline:validate` work; old names removed (nothing outside CI and
  package.json references them — verify with a repo grep).
- Parity CI jobs (schema + query lanes) green.
- `scripts/parity/` root contains only `package.json` and `pipeline/` after
  this story.
