---
title: "mail-common-address-field-utf8-arm-misreads-decoded-string"
status: done
updated: 2026-11-12
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10021
claim: "2026-11-12T12:11:39Z"
assignee: "mail-check-delivery-params-gem-deprecate-wrappers"
blocked-by: null
closed-reason: null
---

# CommonAddressField's UTF-8 arm misreads a decoded string

## Context

`Mail::CommonAddressField` (`vendor/mail/2.8.1/lib/mail/fields/common_address_field.rb`,
the `utf8_if_needed` helper) forces a value to UTF-8 and keeps it when
`utf8.valid_encoding?`. trails (`packages/mail/lib/fields/common-address-field.ts:141-147`)
calls `isValidEncoding(forceEncoding(rbObjDup(val), Encoding.UTF_8), Encoding.UTF_8)`.
`forceEncoding` hands back the decoded JS string for valid UTF-8 bytes, and
`isValidEncoding` (`packages/ruby-compat/lib/string/force-encoding.ts:81`) reads a
string one character per byte, so non-ASCII UTF-8 fails the check. trails#9949
fixed the identical bug in `UnstructuredField` (`unstructured-field.ts:26`) by
checking the original bytes, which `force_encoding` leaves unchanged.

## Acceptance criteria

- [ ] The validity check runs on `val`'s bytes, the same converged shape as
      `UnstructuredField`, so a UTF-8 address header read from a file returns a string.
- [ ] A regression test (failing on the baseline) covers a binary-read UTF-8 address.
