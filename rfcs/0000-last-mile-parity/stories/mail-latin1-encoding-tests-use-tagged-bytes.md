---
title: "mail: port the latin-1 encoding tests over tagged Uint8Arrays"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: mail
packages: [mail]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five specs ("allows multiple unencoded strings in …" ×3 and two siblings) are
skipped as "no String encoding tag". The describe already builds
ISO-8859-1-tagged `Uint8Array`s (`packages/mail/test/encoding.test.ts:140-144`),
and CLAUDE.md "A String has no encoding tag either" allows a tagged
`Uint8Array`.

## Acceptance criteria

- [ ] The five specs run over tagged `Uint8Array` input and pass.

## Verification

```sh
pnpm vitest run packages/mail/test/encoding.test.ts
```
