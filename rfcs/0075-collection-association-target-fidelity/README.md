---
rfc: "0075-collection-association-target-fidelity"
title: "Collection association target-store fidelity"
status: draft
created: 2026-07-26
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
clusters:
  - "associations"
priority: 2
---

Extracted from RFC 0023 (surfaced-deviations) triage, 2026-07-26.

Rails has exactly one `@target` per collection association, owned by `CollectionAssociation`, with `CollectionProxy` delegating every read and mutation to it. trails still has two stores (the canonical `CollectionProxy._target` per RFC 0006, plus the `association()` wrapper's own target) and several read paths (`toArray`, replace diffs, loader writeback, mid-load guards) that bypass or shadow the canonical store. This RFC collects the open target-store/loadedness deviations so they converge as one campaign instead of per-story workarounds accreting (see PR #5188's isFindFromTarget workaround, #5294's parallel snapshot).
