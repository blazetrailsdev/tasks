---
title: "PR 0 — install Arel visitor on establishConnection"
status: ready
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Today `syncHandlerVisitor()` re-points the global Arel `toSql` visitor at the
handler's adapter in `beforeEach`, because `test-setup.ts` resets the global
visitor after every test. This dance is the only reason `bootstrap-test-handler`
must run per-test.

Fold visitor installation into `establishConnection`: establishing a connection
installs the matching Arel visitor, and `test-setup.ts` stops resetting it out
from under the handler. This removes the `beforeEach syncHandlerVisitor` entirely.

See RFC 0002 §Design (visitor sync) and §Rollout PR 0.

## Acceptance criteria

- [ ] `establishConnection` installs the Arel visitor matching the established
      adapter
- [ ] `test-setup.ts` no longer resets the global visitor after each test
- [ ] `syncHandlerVisitor` `beforeEach` calls are removed from the suite path
- [ ] Full suite green on all three drivers

## Notes

Ships **first** — touches production `connection-handling.ts` + `test-setup.ts`,
so it changes behavior beyond test setup and must be green before any other
story in this RFC starts.
