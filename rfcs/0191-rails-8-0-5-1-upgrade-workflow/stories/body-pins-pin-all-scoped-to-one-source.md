---
title: "body-pins --pin-all scoped to one source for gem pin floors"
status: done
updated: 2026-11-24
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10679
claim: "2026-11-23T23:19:57Z"
assignee: "body-pins-pin-all-scoped-to-one-source"
blocked-by: null
closed-reason: null
---

## Context

A gem bump retakes its own pin floor before it moves `ref`; see vendor/README.md
§ "Upgrading a source", step 3. `scripts/api-compare/body-pins.ts` has
`--pin <ruby-file>` and `--pin-all`, but `--pin-all` pins every package. It
also clears rows in `bump-ledger/rails.json` (trails#10631 cleared 234). Each
gem floor so far was taken by hand: nokogiri in trails#10577, zeitwerk in
trails#10621 and loofah in trails#10631. Each time the author copied
`body-pins.json`, ran `pins:all`, filtered the result back to one package, and
ran `git checkout` on the other rewritten files. The runbook writes that
procedure out.

## Acceptance criteria

- [ ] `body-pins.ts --pin-all --source <name>` (or `--package`) pins only the
      matched pairs of that source's packages. Every other pin is left
      byte-identical, and no ledger outside that source is touched.
- [ ] Unit test in `body-pins.test.ts`.
- [ ] vendor/README.md step 3 names the flag in place of the hand procedure.
