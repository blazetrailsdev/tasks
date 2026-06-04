---
title: "Follow-up — persistent PG/MySQL purge handlers"
status: ready
rfc: "0002-bootstrap-databasetasks"
cluster: followup
deps: ["rework-test-setup"]
deps-rfc: []
est-loc: 150
priority: 75
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR 2's first cut ships without PG/MySQL purge handlers by gating on "driver
supports purge" — sqlite `:memory:` purge is a no-op (re-establish drops the
DB). Persistent PG/MySQL purge handlers, needed for full `reconstructFromSchema`
parity on those drivers, land here as a follow-up.

See RFC 0002 §Design (resolved — purge handlers) and §Rollout follow-ups.

## Acceptance criteria

- [ ] Purge handlers implemented for persistent PG and MySQL test DBs
- [ ] `reconstructFromSchema` exercises purge on the cold path for PG/MySQL
- [ ] PG and MySQL suites green

## Notes

Not on the critical path to the bootstrap-handler deletion; can land any time
after [[rework-test-setup]].
