---
title: "Converge the receiver-as-first-argument residue"
status: ready
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: api-compare
packages: ["activerecord", "activemodel"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four `kind: "args"` rows of the shape "Ruby passes nothing, TypeScript passes
one argument", where the extra argument is the receiver Ruby gets from `self`:

| TS file                                                          | Ruby method                | Call                   | trails passes |
| ---------------------------------------------------------------- | -------------------------- | ---------------------- | ------------- |
| `activemodel/src/attribute-registration.ts`                      | `reset_default_attributes` | `subclasses`           | `cls`         |
| `activerecord/src/associations/preloader/through-association.ts` | `records_by_owner`         | `loaded?`              | `owner`       |
| `activerecord/src/reflection.ts`                                 | `join_scopes`              | `scope`                | `rel`         |
| `activerecord/src/test-databases.ts`                             | `create_and_load_schema`   | `establish_connection` | `Base`        |

This is the residue of the receiver-threading class that RFC 0099's earlier
waves drained from 140 rows repo-wide to ~40. Each one needs the same
judgement: is the host genuinely unavailable without threading it (the
sanctioned mixin idiom, per CLAUDE.md "Module mixins"), or did the port take a
free function where Rails has an instance method that could stay one?

`test-databases.ts` is the strongest candidate for genuine convergence — it
passes the `Base` constant explicitly where Rails calls `establish_connection`
on the class in scope.

## Acceptance criteria

- Each row either converges (the call moves onto the host so no receiver is
  passed) or carries a reviewed one-line baseline `reason` naming the mixin
  shape that forces it.
- Rows deleted by hand from `scripts/api-compare/call-mismatches-exclude/**`.
- `pnpm parity:api:calls:args` green.
