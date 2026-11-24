---
title: "activestorage, trailties, solid-queue: close the API gap"
status: ready
rfc: "0000-near-complete-packages-to-100"
cluster: small-packages
packages: [activestorage, trailties, solid-queue]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
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

- [ ] API (`methodsMissing` summed over `package-summary.json` from `pnpm parity:packages`) is 100% for activestorage, trailties and solid-queue.
- [ ] Each removed member has a reasoned `unported-files` or
      `SCOPED_SKIP_GROUPS` entry.

## Verification

```sh
pnpm parity:api --missing
```
