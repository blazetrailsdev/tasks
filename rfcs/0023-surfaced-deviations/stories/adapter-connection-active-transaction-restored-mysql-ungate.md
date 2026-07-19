---
title: "Re-evaluate PG-only gate on 'active transaction is restored after remote disconnection' (MySQL verifyBang+translation now fixed)"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-19T00:51:11Z"
assignee: "adapter-connection-active-transaction-restored-mysql-ungate"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4935 (adapter-connection-failure-error-classification). The
`AdapterConnectionTest` case
`active transaction is restored after remote disconnection` (adapter.test.ts) is
gated `it.skipIf(adapterType !== "postgres")`. Its comment cited TWO MySQL
divergences: (1) mysql2 `verifyBang` keyed off the optimistic sync `active`
getter, so it never detected a server-side kill and never reconnected; and (2)
mysql2's client-side `"Can't add new command when connection is in closed state"`
was not translated to an ActiveRecord error. #4935 fixed BOTH: it added a
`Mysql2Adapter.verifyBang` override that probes with a real ping (`activeAsync`,
Rails' `active?`), and taught `isMysql2ConnectionError` to map the closed-state
driver error to `ConnectionFailed`. So the PG-only gate may now be stale.

## Acceptance criteria

- [ ] Re-evaluate the `skipIf(adapterType !== "postgres")` gate on
      `active transaction is restored after remote disconnection`; un-gate on
      MySQL/MariaDB if it passes verbatim, else document the remaining blocker.
- [ ] Update the now-stale comment in adapter.test.ts that attributes the gate to
      the two divergences #4935 already fixed.
