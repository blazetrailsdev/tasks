---
title: "Close RFC 0163 — residue to zero"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "routing-invented-surface-and-generate-prefix-arity",
    "routing-call-baselines-to-zero",
    "port-routing-test-mapper-skips-part-3",
    "port-routing-test-alt-app-through-route-defaults-skips",
    "port-routing-test-generation-errors-through-relative-root-skips",
    "port-controller-routing-test-route-set-part-2-and-rack-mount",
    "port-controller-routing-test-legacy-route-set-part-2",
    "port-resources-test-part-2",
    "port-prefix-and-url-generation-tests",
    "port-routes-inspector-test-skips",
    "port-mapper-and-concerns-test-skips",
    "port-mount-and-custom-url-helpers-tests",
    "port-small-routing-and-url-for-test-files",
    "port-url-for-integration-test",
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The closing sweep. Any test left `it.skip` by a sibling story carries the id of
the story that fixes the bug it exposed; this story checks every one of those
has landed, and that the Verification bullets in the RFC README hold.

## Acceptance criteria

- No `it.skip` remains in any file in the RFC's tests table.
- Every Verification bullet in the RFC README holds; any that does not is a
  filed story, not a note.
