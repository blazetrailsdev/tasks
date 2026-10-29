---
title: "Trace or converge Action Cable receipts outside the socket-layer files"
status: claimed
updated: 2026-10-29
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-29T14:57:22Z"
assignee: "actioncable-close-out"
blocked-by: null
closed-reason: null
---

## Context

RFC 0177's Verification line "Every receipt under `packages/actioncable/src` is
`PERMANENT`, sits in a file the CLAUDE.md section names (or at an adapter call a
story lists), and cites that section" does not hold, and cannot as written:

- Receipts carry no prose (`no-freeform-comments`; CLAUDE.md § "Fidelity is the
  job"), so no receipt can cite a section inline.
- 15 of the 19 receipts sit outside the four socket-layer files named in § "Node's
  event loop stands in for Action Cable's nio4r selector". Each one is for a different
  shortfall. For example, `server/broadcasting.ts#broadcast` and
  `channel/base.ts#transmit` carry `@missingRailsArgs truncate — PERMANENT`
  because JS strings have no `String#truncate` and activesupport ports it
  receiver-first (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/broadcasting.rb:50-51`,
  `channel/base.rb:209`). Others: `channel/test-case.ts` / `connection/test-case.ts`
  `include`, `channel/streams.ts` `subscribe`, `channel/base.ts`
  `public_instance_methods` and `name`, `subscription-adapter/redis.ts`
  `redis_connector`, plus the `@noRailsEquivalent` sites in
  `server/configuration.ts`, `server/worker.ts`, `connection/base.ts`,
  `channel/base.ts` and `test-helper.ts`.

## Acceptance criteria

- [ ] Each of the 15 receipts is either converged (the call made with Rails'
      arguments) or traced to the ratified CLAUDE.md section or language limit
      that forces it, recorded in this story.
- [ ] The RFC's Verification line is amended to the rule that actually applies
      (PERMANENT, traced to a ratified section), via a markdown PR.
