---
title: "The tail: migrate the remaining 14 packages' 161 ruby-compat barrel imports"
status: draft
updated: 2026-10-14
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages:
  [
    "rack",
    "msgpack",
    "i18n",
    "date",
    "rack-test",
    "activerecord-cli",
    "rack-session",
    "bcrypt",
    "activejob",
    "globalid",
    "html-sanitizer",
    "did-you-mean",
    "ruby-compat",
    "website",
  ]
deps:
  - ruby-compat-wildcard-subpath-export
  - boot-graph-measurement-harness
  - migrate-activesupport-off-the-ruby-compat-barrel
  - migrate-activerecord-off-the-ruby-compat-barrel
  - migrate-actionpack-off-the-ruby-compat-barrel
  - migrate-trailties-off-the-ruby-compat-barrel
  - migrate-actionview-off-the-ruby-compat-barrel
  - migrate-arel-off-the-ruby-compat-barrel
  - migrate-activemodel-off-the-ruby-compat-barrel
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After the seven heavyweight consumers, the remaining barrel imports of
`@blazetrails/ruby-compat` are:

| Package          | Imports |
| ---------------- | ------- |
| rack             | 46      |
| msgpack          | 23      |
| i18n             | 20      |
| date             | 15      |
| rack-test        | 11      |
| activerecord-cli | 9       |
| rack-session     | 8       |
| bcrypt           | 8       |
| activejob        | 8       |
| globalid         | 7       |
| website          | 3       |
| ruby-compat      | 1       |
| html-sanitizer   | 1       |
| did-you-mean     | 1       |

161 imports across 14 packages. They are grouped into one story because each is
too small to be worth its own, and they are what closes the RFC's verification
target: the barrel must reach **0** importers in the boot graph, which a
remaining `rack` or `i18n` import would prevent.

## Acceptance criteria

- [ ] `grep -r 'from "@blazetrails/ruby-compat"' packages/*/src` returns **0**
      across the whole workspace
- [ ] `pnpm build`, lint and the full test suite are unchanged
- [ ] The boot-graph harness reports ruby-compat's boot contribution at
      or below the target the harness story measured and committed, down
      from 147

## Notes

`ruby-compat`'s own single self-import of its barrel is in this list and should
become a direct relative import.

The target is the measured subpath union (~54–60) rather than `≤10` deliberately: ruby-compat has a 28-module
circular import group, and an SCC loads entirely whenever it is entered. Going
below the floor is explicitly out of scope for this RFC.
