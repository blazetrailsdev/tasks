---
title: "F-9b — adapter_test transaction restore/remote-disconnection (non-in-memory)"
status: ready
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Residue from F-9a (#3150), which shipped the SQLite-runnable transaction-state
_reset_ tests in `adapter.test.ts`. These remaining `AdapterConnectionTest`
skips need a non-in-memory adapter with raw-connection reopen on `reconnect!`
(Rails gates the whole suite `unless in_memory_db?`):

- `materialized transaction state can be restored after a reconnect`
- `unmaterialized transaction state can be restored after a reconnect`
- `transaction restores after remote disconnection`
- `active transaction is restored after remote disconnection`
- `dirty transaction cannot be restored after remote disconnection`

Plus the 2 bind probes `select all insert update delete with [casted] binds`
(need an Event-model fixture + BindParam round-trip).

Ours: `packages/activerecord/src/adapter.test.ts`. Rails:
`activerecord/test/cases/adapter_test.rb` (`AdapterConnectionTest`).
Test names match Rails verbatim.

## Acceptance criteria

- [ ] Restore/remote-disconnection tests pass against a file-backed (non-in-memory)
      SQLite adapter, or are reclassified in `unported-files.ts` if reopen wiring
      is genuinely out of reach.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
