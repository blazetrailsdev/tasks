---
title: "`muxd`: host-side HTTP pane agent"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - mux-port-fleet-policy
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Covers the RFC's **Topology** section. It runs on the host as a systemd user unit and serves the `PaneSender` surface over HTTP.

## Acceptance criteria

- [ ] `bin/muxd` serves the endpoints listed in the RFC, bound to loopback and the `fleet` network address
- [ ] A systemd user unit and its install steps are documented
- [ ] `GET /up` and a restart policy are in place
- [ ] Reads are disabled until G1 is green (enforced in config)
- [ ] Every endpoint except `GET /up` requires the bearer token from the host token file, and a test checks that a request without it gets `401`
- [ ] The install steps cover Node 24 on the host
