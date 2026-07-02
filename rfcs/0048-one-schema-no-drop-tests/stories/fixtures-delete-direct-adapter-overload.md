---
title: "Delete the direct-adapter useFixtures overload once callers are zero"
status: done
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: ["fixtures-add-nontransactional-mode", "fixtures-caller-supplied-connection-adapter"]
deps-rfc: []
est-loc: 80
priority: 8
pr: 4389
claim: "2026-07-01T23:46:17Z"
assignee: "fixtures-delete-direct-adapter-overload"
blocked-by: null
---

## Context

Split from `fixtures-converge-or-ratify-remaining-direct-adapter-callers`
(RFC 0048). This is the terminal cleanup: delete the direct-adapter
`useFixtures` overload once it has zero remaining test-file callers.

Depends on both sibling stories removing their callers:

- `fixtures-add-nontransactional-mode` — converges `view.test.ts` +
  `signed-id.test.ts`.
- `fixtures-caller-supplied-connection-adapter` — converges
  `multiple-db.test.ts` + `transaction-instrumentation.test.ts`.

The overload and its escape-hatch doc comment live at
`packages/activerecord/src/test-helpers/use-fixtures.ts:306-318`. Must be its
own PR (from `main`) per the no-stacking rule — it cannot land until the two
feature PRs merge.

Coordinate with `fixtures-rename-handler-callsites` and
`fixtures-drop-schema-arg-default-off` (RFC 0048 acceptance #2 of
`fixtures-unify-direct-adapter-path`).

## Acceptance criteria

- [ ] Confirm zero test-file callers of the direct-adapter `useFixtures`
      overload remain (grep `useFixtures(` across `packages/activerecord/src`).
- [ ] Delete the direct-adapter overload and its dead code paths in
      `use-fixtures.ts`.
- [ ] If any legitimate internal caller survives, keep the export but mark it
      `@internal` and document why (do not leave it publicly reachable).
- [ ] No test names change; `test:compare` non-negative.
