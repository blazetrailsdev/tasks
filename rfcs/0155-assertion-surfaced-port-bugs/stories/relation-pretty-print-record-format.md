---
title: "relation-pretty-print-record-format"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"relations limit the records in #pretty_print at 10"**.

- Rails: activerecord/lib/active_record/relation.rb:1264 (pretty_print); Ruby pp renders each record as #<Post:0x... ...>
- trails: packages/activerecord/src/pretty-print.ts, packages/activerecord/src/relation.ts:401-409
- Observed: pp(relation) writes no #<Post: entries (0 matches of /#<\w\*Post:/ instead of 10)

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
