---
title: "RFC from 2 schema.ts migration docs"
status: done
updated: 2026-06-04
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`trails-models-dump-schema-ts-migration.md` and
`trails-tsc-schema-ts-migration.md` cover the schema.ts dump/consume migration.
See RFC 0011 §Phase 2.

## Acceptance criteria

- [ ] New RFC authored from both docs via the placeholder → PR flow.
- [ ] Open migration steps → dep-aware stories; sequencing/design in the body.
- [ ] Both docs queued for deletion in `decommission-docs`.

## Notes

Confirm against `main` which phases already shipped before storying them.

## Result (2026-06-04)

**Both docs are COMPLETE** at `origin/main` — `trails-tsc-schema-ts-migration.md`
(status: complete, #2759/#2894) and `trails-models-dump-schema-ts-migration.md`
("COMPLETE — PRs 1–4 #2851/#2861/#2889/#2895; live-DB path dropped #2896").
schema.ts is now the single committed schema artifact (Rails `db/schema.rb`
analog), consumed statically by both `trails-tsc` and `trails-models-dump`.

Per decision, **no RFC is authored for completed work.** The one residual — the
composite-FK synthesized-name round-trip (codegen-only, documented as harmless)
— was folded into **RFC 0003** as a low-priority `deferred` story
([models-dump-composite-fk-roundtrip](../../0003-activerecord-cli/stories/models-dump-composite-fk-roundtrip.md)),
the relevant `activerecord-cli` bucket. Both source docs are queued for deletion
in `decommission-docs`.
