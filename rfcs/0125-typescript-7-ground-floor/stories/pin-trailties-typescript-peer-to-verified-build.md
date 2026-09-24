---
title: "Pin trailties' typescript peer to the verified 7.1 nightly"
status: done
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: 3
pr: trails#8032
claim: "2026-09-24T13:32:21Z"
assignee: "auto-import-relative-specifier-parity-test"
blocked-by: null
closed-reason: null
---

## Context

trails#8003 pinned `@blazetrails/activerecord`'s `typescript` peer to exactly
`7.1.0-dev.20260920.1` (`packages/activerecord/package.json`), because
`typescript/unstable/*` has no semver guarantee and that is the only build the
port was verified against. The story's decision is recorded in
`port-type-virtualization-to-ts7-api.md` § "Decision (2026-09-23)".

`@blazetrails/trailties` (trails#8000, `parseTs()` on `typescript/unstable/sync`)
still declares `"typescript": "^7.1.0-dev.20260920.1"` as its optional peer
(`packages/trailties/package.json`). The caret admits later nightlies and stable
7.x, whose `unstable/` surface may change, so the range overstates what was
verified. The review of #8003 raised exactly this against activerecord.

## Acceptance criteria

- [ ] `packages/trailties/package.json`'s `typescript` peer is the exact verified
      build (`7.1.0-dev.20260920.1`), matching activerecord.
- [ ] `pnpm install` lockfile updated; `packages/trailties/src/template-builder/testing.trails.test.ts` passes.
