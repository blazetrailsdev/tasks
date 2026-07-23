---
title: "fakeRecordEngine doc block still claims suite uses generic ToSql"
status: done
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 5108
claim: "2026-07-23T01:08:49Z"
assignee: "arel-fake-record-engine-doc-stale"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/test-helpers/connection.ts` (`fakeRecordEngine` doc block,
~lines 145-155 post-#5092) still says "trails is not there yet:
`test-setup-engine.ts` still installs a generic `ToSql`... Tracked by story
`arel-suite-engine-is-fake-record-base`" — but
`packages/arel/src/test-setup-engine.ts:12` already does
`Table.engine = fakeRecordEngine` suite-wide (its own header documents the
switch). The stale paragraph misstates suite state and points at a
completed/absent story.

## Acceptance criteria

- [ ] Rewrite the `fakeRecordEngine` doc block to reflect that the double IS
      the suite-wide engine (mirroring Rails `test/cases/arel/helper.rb:19-20`),
      dropping the "not there yet"/opt-in paragraph and the stale story pointer.
