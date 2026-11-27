---
title: "migrate-the-remaining-packages-off-the-ruby-compat-barrel"
status: in-progress
updated: 2026-11-27
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10844
claim: "2026-11-27T16:14:48Z"
assignee: "generator-templates-import-ruby-compat-by-subpath"
blocked-by: null
closed-reason: null
---

## Context

`migrate-the-tail-packages-off-the-ruby-compat-barrel` moved the 13 packages its census listed (rack, msgpack, i18n, date, rack-test, activerecord-cli, rack-session, bcrypt, activejob, globalid, website, html-sanitizer, did-you-mean) onto ruby-compat subpaths, and pointed every `declare module "@blazetrails/ruby-compat"` augmentation at the owning subpath (`/object`, `/thread`, `/fiber`, `/include`, `/load-error`, `/net/protocol`, `/string/method-table`). That census was stale. `git grep -l 'from "@blazetrails/ruby-compat"' -- 'packages/*/lib/**'` still finds ~700 files in about 40 more packages: solid-queue 79, mail 74, activestorage 54, actioncable 39, rake 37, tzinfo 29, actionmailbox 29, thor 27, chronic 26, actiontext 24, solid-cache 23, vite-assets 21, turbo 19, nokogiri 18, actionmailer 18, zeitwerk 17, pg 15, sqlite3 13, trailties 11, and smaller ones.

Boot-graph harness (`pnpm tsx scripts/boot-graph/measure.mts`): ruby-compat still loads 205 of its 206 modules, against a target of 180. Barrel importers in the boot graph include rake, tzinfo, nokogiri, pg, sqlite3, zeitwerk and actionview.

Also left by trails#10836: activejob and msgpack (dropped for the LOC ceiling), and the three `NetModule` augmentations (`mail/lib/network/retriever-methods/imap.ts`, `pop3.ts`, `net-smtp/lib/protocol.ts`), which stay on the barrel because ESLint's project service (TS 6 with source redirects) cannot resolve an augmentation of the nested subpath `@blazetrails/ruby-compat/net/protocol`.

## Acceptance criteria

- [ ] `git grep 'from "@blazetrails/ruby-compat"' -- 'packages/*/lib'` returns 0, outside generator templates
- [ ] Boot-graph harness reports ruby-compat at or below its target
- [ ] Split by package across PRs within the LOC ceiling; boot-graph packages (rake, tzinfo, nokogiri, pg, sqlite3, zeitwerk, actionview) first
