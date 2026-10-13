---
title: "Each package.json records the upstream ref it mirrors, generated from the lockfile"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: release
packages:
  [
    scripts,
    arel,
    activemodel,
    activerecord,
    activesupport,
    actionpack,
    actionview,
    activejob,
    trailties,
    rack,
    rack-session,
    bcrypt,
    pg,
    sqlite3,
  ]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 6 "The mirrored ref is recorded twice". Whichever version scheme the
owner picks, a consumer and a release script both need to read which upstream
ref a package was verified against. Today that fact lives only in
`vendor/sources.ts` and `vendor/sources.lock.json`, neither of which ships.
The run-time half already exists as the ported `gem_version.rb` constants.

## Acceptance criteria

- [ ] A script writes a `mirrors` field into the `package.json` of every
      package that `vendor/sources.ts` maps to a source:
      `{ "source": "<name>", "ref": "<tag>", "sha": "<40 hex>" }`. A package
      built from two sources lists both.
- [ ] A Preflight check fails when a `mirrors` field differs from the
      lockfile, so a `ref` bump that forgets it is red.
- [ ] Packages with no upstream (ruby-compat, trails-tsc, tse-compiler) have
      no field, and the check says so explicitly instead of skipping them
      silently.
- [ ] While a bump ledger for a source has rows, the field for its packages
      carries `"verifying": true`, and the check enforces that both ways.
- [ ] vendor/README.md's upgrade steps name the script.

## Notes

No version number changes here; that is `adopt-the-ruled-version-scheme`.
