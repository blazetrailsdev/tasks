---
title: "PR 0 — install Arel visitor on establishConnection (SUPERSEDED)"
status: done
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

> **SUPERSEDED.** The original plan was to fold visitor installation into
> `establishConnection` (install-on-establish, #2600). RFC 0007
> (`0007-remove-global-arel-visitor`) takes the opposite, Rails-faithful
> direction: **remove** AR's global visitor entirely and route `toSql` through
> `connection.toSql`, rather than growing the global shim. #2600 is closed.
>
> The visitor-removal that this story aimed at is realized by RFC 0007 Phase C
> ([[c-collapse-into-bootstrap]]), which deletes `syncHandlerVisitor` and the
> `setupHandlerSuite` `beforeEach` as part of this RFC's PR 2/3. **Do not work
> this story** — it is kept as a record of the superseded approach.

Original intent: `syncHandlerVisitor()` re-points the global Arel `toSql` visitor
at the handler's adapter in `beforeEach`, because `test-setup.ts` resets the
global after every test. This story would have folded that into
`establishConnection`.

See RFC 0007 §Disposition of #2600.

## Acceptance criteria

- [ ] (superseded — none; tracked under RFC 0007 Phase B/C)

## Notes

Retained for history. The live work is in RFC 0007. RFC 0002's other PRs
(schema-file generator, test config, test-setup rework, handler deletion) are
unaffected and proceed normally; the test-setup rework's visitor concern is
handled by RFC 0007 Phase C.
