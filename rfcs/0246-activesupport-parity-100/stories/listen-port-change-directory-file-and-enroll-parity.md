---
title: "listen-port-change-directory-file-and-enroll-parity"
status: closed
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: operator ruled 2026-11-22 that listen is a wrapper over @parcel/watcher, not a port of its internals; see listen-wraps-parcel-watcher."
---

# port listen's Change, Directory and File, and enroll listen in parity

## Context

`packages/listen` (from listen-port-polling-adapter-record-and-event-loop)
ports `Error`, the `Listen.logger` / `adapter_warn` half of `logger.rb`,
`Silencer`, `Record`, `Record::Entry` and `Record::SymlinkDetector`. Still
unported, all three reading the Record:

- `vendor/listen/v3.9.0/lib/listen/change.rb` (69): `Change::Config`
  (`silenced?`, `queue`) and `Change#invalidate` (`:40-66`).
- `vendor/listen/v3.9.0/lib/listen/directory.rb` (93): `Directory.scan` with
  its inner `rescue Errno::ENOENT ... retry` (`:24-34`), `ascendant_of?`,
  `_async_changes`, `_change`, `_children`. `Errno::EHOSTDOWN` landed in
  ruby-compat with the Record PR.
- `vendor/listen/v3.9.0/lib/listen/file.rb` (95): `File.change`,
  `inaccurate_mac_time?`. ruby-compat's `FsStatResult` has no `ctime`;
  `Digest.SHA256.file(...).digest()` compares with `rbEqual`.

`vendor/sources.ts` registers listen with `compareApi: false` /
`compareTests: false` pointing at this story. Enrolling it touches every
enumerating guard: `vendor/sources.test.ts`, `extract-ts-tests.ts`
`packages`, `compare.ts` `pkgDirs` (listen's specs are `*_spec.rb`),
`MANIFEST_PACKAGES`, `lint-ruby-compat-calls` `ENROLLED_PACKAGES`, and a
hand-added `assertion-mismatch-mark.json` row.

## Acceptance criteria

- [ ] `packages/listen/lib/change.ts`, `directory.ts`, `file.ts` port the three
      files with listen's names and control flow, async fs through ruby-compat.
- [ ] `spec/lib/listen/change_spec.rb`, `directory_spec.rb` and `file_spec.rb`
      are ported under their rspec names.
- [ ] listen is enrolled: `compareApi` / `compareTests` true, every guard above
      updated, `pnpm parity:changed` green.
