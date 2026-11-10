---
title: "mail-unstructured-field-utf8-arm-misreads-decoded-string"
status: draft
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
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
closed-reason: null
---

# UnstructuredField keeps a UTF-8 header as bytes: isValidEncoding misreads a decoded string

## Context

`Mail::UnstructuredField#initialize`
(`vendor/mail/2.8.1/lib/mail/fields/unstructured_field.rb:26-28`) marks an
ASCII-8BIT value UTF-8 when `value.dup.force_encoding(UTF_8).valid_encoding?`.
trails (`packages/mail/lib/fields/unstructured-field.ts:24-27`) calls
`forceEncoding(rbObjDup(value), Encoding.UTF_8)`, which for valid UTF-8 bytes
answers the decoded JS string, and then `isValidEncoding(utf8, Encoding.UTF_8)`
(`packages/ruby-compat/lib/string/force-encoding.ts:81-99`), which reads a JS
string one character per byte. `"Säying"`'s `ä` becomes the lone byte `0xE4`,
the check fails, and the field keeps the `Uint8Array`. So
`read_fixture('emails', 'rfc6532', 'utf8_headers.eml').subject` answers bytes
where Ruby answers `'Säying Hello'`
(`vendor/mail/2.8.1/spec/mail/example_emails_spec.rb:368-370`).

## Acceptance criteria

- [ ] `UnstructuredField`'s UTF-8 arm accepts a value `forceEncoding` decoded,
      without breaking `isValidEncoding`'s one-character-per-byte callers.
- [ ] `RFC6532 UTF8 headers > subject` in `packages/mail/test/example-emails.test.ts`
      is un-skipped and passes.
