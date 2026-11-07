---
title: "Mail structured fields parse binary header values byte-wise instead of a UTF-8 decode in Field#parseField"
status: in-progress
updated: 2026-11-07
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9822
claim: "2026-11-07T03:06:36Z"
assignee: "mail-structured-fields-parse-binary-values-without-utf8-decode"
blocked-by: null
closed-reason: null
---

## Context

`Field#parseField` (`packages/mail/src/field.ts`, trails#9790) unfolds a binary field value, then, for a structured field class, decodes valid UTF-8 bytes to a JS string (`forceEncoding`, receipted `@inventedArm forceEncoding — PERMANENT`). Invalid bytes are read one character per byte (`binaryString`). Rails passes the unfolded original binary String to every structured `klass.parse` (`vendor/mail/2.8.1/lib/mail/field.rb:261-268`). Only `UnstructuredField` retags valid UTF-8 (`vendor/mail/2.8.1/lib/mail/fields/unstructured_field.rb:25-28`).

The decode exists because the ported structured parsers return JS text. Reading every value one character per byte would turn a UTF-8 parameter such as `filename=ciële.txt` (`attachments-list.test.ts` › "should decode an attachment without ascii compatible filename") into mojibake. In Ruby, a binary value is retagged later, at the decoded-value site.

## Acceptance criteria

- `parseField` passes every binary value to `klass.parse` read one character per byte, with no `forceEncoding`. The `@inventedArm forceEncoding` receipt is deleted.
- The structured fields' decoded readers (parameter values, display names, filename) retag one-character-per-byte text as UTF-8 at the point where Mail does, citing the Ruby line, so "should decode an attachment without ascii compatible filename" still passes.
