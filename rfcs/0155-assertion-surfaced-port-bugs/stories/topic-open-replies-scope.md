---
title: "topic-open-replies-scope"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"relation with private kernel method"**.

- Rails: activerecord/test/models/topic.rb:51 (has_many :open_replies, -> { open }, class_name: "Reply", foreign_key: "parent_id")
- trails: packages/activerecord/src/test-helpers/models/topic.ts:127
- Observed: hasMany("openReplies") is declared without the -> { open } scope, so it returns every reply

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
