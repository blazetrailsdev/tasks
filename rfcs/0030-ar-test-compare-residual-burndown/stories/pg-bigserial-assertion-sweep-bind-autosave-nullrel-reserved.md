---
title: "Converge BigInt PK assertions: bind-parameter/autosave/null-relation/reserved-word (flip prereq)"
status: claimed
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: null
claim: "2026-06-23T17:45:35Z"
assignee: "pg-bigserial-assertion-sweep-bind-autosave-nullrel-reserved"
blocked-by: null
---

## Context

Prerequisite for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030). See
sibling sweep story for root cause (int8→BigInt on default-PK flip). CI run
28040851821 surfaced these mid-tier files.

Failing assertion sites (verbatim line numbers from the flip CI run):

- `packages/activerecord/src/bind-parameter.test.ts`: 153,173,188,213,238,367
- `packages/activerecord/src/autosave.test.ts`: 148,194,284,296,309,364
- `packages/activerecord/src/null-relation.test.ts`: 114,115,121,122
- `packages/activerecord/src/reserved-word.test.ts`: 182,190,200

Converge each to expect `BigInt` where the value originates from a default-PK
column; verify against the Rails test that it's the PK/FK.

## Acceptance criteria

- [ ] Every listed assertion is green on the PG lane WITH the bigserial flip
      applied locally.
- [ ] Green on all three lanes. Test names verbatim. Do NOT touch the deserializer.
