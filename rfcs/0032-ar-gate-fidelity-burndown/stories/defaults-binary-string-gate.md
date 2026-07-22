---
title: "defaults-binary-string-gate"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --gates` (2026-07-22): defaults.test.ts:216 "default binary
string" is [wrong-gate]: rails `adapters=[postgresql,sqlite] guards=[mariadb]`
(vendor/rails/activerecord/test/cases/defaults_test.rb — runs on PG/SQLite and
on MySQL only when mariadb), ts `skipIf(adapterType !== "mysql")` which
extracts to `adapters=[none]` (inverted: trails runs it ONLY on mysql — the
opposite of Rails).

Fix the gate to Rails' form: postgresql,sqlite plus the mariadb guard for the
mysql lane (see how other mariadb-guarded tests express it so the extractor
recognizes the guard).

## Acceptance criteria

- [ ] Extracted ts gate equals rails
      (`postgresql,sqlite` + mariadb guard); no wrong-gate row for it.
- [ ] Test passes on the lanes the Rails gate implies. Name unchanged.
