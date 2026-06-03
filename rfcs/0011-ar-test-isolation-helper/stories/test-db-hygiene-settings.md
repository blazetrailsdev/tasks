---
title: "Collation split, UTC pin, SQLite strict, PG min_messages"
status: draft
rfc: "0011-ar-test-isolation-helper"
cluster: test-config-fidelity
deps: ["pg-prepared-statements-off-ci"]
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' two test databases use **deliberately different** collations
(`arunit` = `utf8mb4_unicode_ci`, `arunit2` = `utf8mb4_general_ci`) to catch
code assuming both connections share collation; `arunit` is pinned
`time_zone: UTC`; SQLite runs `strict: true`; PG runs `min_messages: warning`.
We provision both DBs with defaults and set none of these.

See RFC 0011 §Motivation "Config fidelity".

## Acceptance criteria

- [ ] The second test DB (`arunit2` analog) is provisioned with a collation
      distinct from the primary
- [ ] Primary test connection pinned to `time_zone: UTC`
- [ ] SQLite test connections set `strict: true` (address any type-affinity
      assumptions this surfaces)
- [ ] PG test connections set `min_messages: warning`
- [ ] All three adapters green

## Notes

Cheap hygiene; rides on the same CI / DB-provisioning surface as
[[pg-prepared-statements-off-ci]] (hence the dep, to avoid conflicting edits to
the same job config). `strict: true` is the one most likely to surface latent
assumptions — expect a few real fixes.

Do NOT add: in-memory SQLite (already `:memory:` per fork) or mysql:8-over-
MariaDB (coverage-plan §6 decision).
