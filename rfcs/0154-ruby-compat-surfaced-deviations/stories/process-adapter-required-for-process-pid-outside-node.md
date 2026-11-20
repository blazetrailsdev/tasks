---
title: "process-adapter-required-for-process-pid-outside-node"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Process.pid` raises "No process adapter configured…" (`packages/ruby-compat/lib/process-adapter.ts:133`) outside Node, and activerecord reads it on every statement-pool access (`packages/activerecord/lib/connection-adapters/statement-pool.ts:73`), so a React Native app must hand-register a whole `ProcessAdapter` (argv, cwd, stdio, signals) to run one query.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 9.

## Acceptance criteria

- ruby-compat ships a minimal single-process adapter used when no host adapter is found (pid, empty env/argv, console-backed stdio), or `Process.pid` has a non-Node default.
- activerecord connects and queries outside Node with no process adapter registered.
