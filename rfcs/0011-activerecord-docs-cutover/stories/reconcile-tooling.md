---
title: "Build story↔shipped-PR reconcile report"
status: done
rfc: "0011-activerecord-docs-cutover"
cluster: reconcile
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: "reconcile-tooling"
blocked-by: null
---

## Context

Phase 1 needs a read-only script that, for every story in RFCs 0001–0010,
gathers shipped-signals and emits a triage verdict so we can tell phantom
("ready" but already merged) work apart from genuinely open work. This is the
prerequisite for `reconcile-existing-rfcs`. See RFC 0011 §Phase 1.

## Acceptance criteria

- [ ] `scripts/reconcile.mjs` loads every story (via `scripts/lib.mjs`) and
      prints a per-story verdict: `likely-done` / `likely-open` / `unknown`,
      each with the evidence that produced it.
- [ ] Signals combined: (a) `pr:` frontmatter → confirm merged via
      `gh pr view`; (b) keyword/anchor match against the trails merged-PR log
      (`gh pr list --state merged` + `git -C ../trails log`); (c)
      `test:compare` / `api:compare` delta where the story names a gap; (d)
      seed obvious AR cases from the memory index.
- [ ] `--json` output in addition to the human table.
- [ ] Read-only: the script never edits story frontmatter — it only reports.
- [ ] Invocation documented (README or RFC 0011).

## Notes

Trails repo is a sibling at `../trails`; `gh` is authenticated. Keep it
dependency-light — reuse `lib.mjs` loaders; no new npm deps.
