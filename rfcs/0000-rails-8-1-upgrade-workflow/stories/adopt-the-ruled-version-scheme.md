---
title: "Set package versions and release groups to the scheme the owner rules"
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
deps: [record-the-mirrored-ref-in-each-package]
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

RFC § 6 and Open questions 2 and 3. Every package is at `0.1.0` and nothing is
published. The recommendation is scheme (b): Rails' `major.minor` with trails'
own patch counter, prerelease tags for maturity, gem ports following their own
gem's `major.minor`, and packages with no upstream on plain semver. The
alternative is (a), own semver from `0.x`.

Blocked until the owner rules. Do not start on the recommendation alone.

## Acceptance criteria

- [ ] The ruling is recorded in the RFC's Open questions with its date.
- [ ] Under (b): the eight Rails-source packages are one fixed release group
      at `8.1.0-alpha.0`; each gem port takes its gem's `major.minor` with a
      prerelease tag; no-upstream packages are unchanged. Under (a): the
      versions and groups the ruling names.
- [ ] A check fails when a Rails-source package's `major.minor` disagrees
      with its `mirrors.ref` (scheme (b) only), or when two packages of a
      fixed group differ.
- [ ] CONTRIBUTING.md states the scheme: what bumps the patch, how a breaking
      TS-only change is numbered, the supported consumer range, and that no
      release is cut while a ledger has rows.
- [ ] Nothing is published by this story.

## Definition of done

Publishing, release automation and the tarball's contents belong to RFC 0100
and a release RFC.
