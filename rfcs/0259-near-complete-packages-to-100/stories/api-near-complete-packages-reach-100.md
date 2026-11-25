---
title: "activestorage, trailties, solid-queue: close the API gap"
status: done
rfc: "0259-near-complete-packages-to-100"
cluster: small-packages
packages: [activestorage, trailties, solid-queue]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10740
claim: "2026-11-25T13:42:42Z"
assignee: "actionview-reaches-100-remainder"
blocked-by: null
closed-reason: null
updated: 2026-11-25
---

## Context

On trailmap (2026-11-24) these packages are at 100% on tests or out of scope
for tests, and short on API only:

- activestorage: 694 / 700
- trailties: 1,759 / 1,769
- solid-queue: 951 / 956

List the members with `pnpm parity:api --missing --package <pkg>`.

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt. A member that trails ports under another name is fixed in the
extractor or by a rename, not by a skip row.

## Acceptance criteria

- [ ] `methodsMissing` is 0 for activestorage, trailties and solid-queue in
      `package-summary.json` (`pnpm parity:packages`).
- [ ] Each removed member has a reasoned `unported-files` or
      `SCOPED_SKIP_GROUPS` entry.

## Verification

```sh
pnpm parity:api --missing --package activestorage
pnpm parity:api --missing --package trailties
pnpm parity:api --missing --package solid-queue
pnpm parity:packages
```
