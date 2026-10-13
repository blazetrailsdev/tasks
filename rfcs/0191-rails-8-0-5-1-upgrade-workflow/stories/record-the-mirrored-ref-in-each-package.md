---
title: "Each package.json records the upstream ref it mirrors, generated from the lockfile"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: tooling
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
- [ ] The field's meaning is documented where it is generated: the ref the
      gates measure the package against. It makes no claim that a burn-down
      is finished; an existing bump ledger for the source says it is not.
- [ ] vendor/README.md's upgrade steps name the script as part of the flip
      PR, so a `ref` bump regenerates the fields in the same PR and the check
      is never switched off.

## Notes

No version number changes here; the version scheme is deferred to the 8.1
upgrade RFC (RFC § 6).
