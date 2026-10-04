---
title: "Marshal.load's sym2encidx reads an unset internal alias as no encoding where MRI raises EncodingError"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8497. `sym2encidx` (`packages/ruby-compat/src/marshal.ts`)
ports `vendor/ruby/v3.3.11/marshal.c:1543-1565`, whose `encoding` arm is
`rb_enc_find_index(StringValueCStr(val))`. The port calls `Encoding.find`
(`packages/ruby-compat/src/encoding.ts`) and maps its `ArgumentError` and its
`null` to MRI's `-1`.

They differ for the `internal` alias while `Encoding.default_internal` is
unset. `Encoding.find("internal")` answers `null`, so the port treats the ivar
as a plain one and `rIvar` raises `FrozenError` setting it on a String. MRI's
`rb_enc_find_index("internal")` answers the alias's unset index, which
`r_ivar_encoding` (`marshal.c:1734-1747`) takes as `idx >= 0` and hands to
`rb_enc_associate_index`. ruby 3.3.11:

    Marshal.load("\x04\bI\"\x06a\x06:\rencoding\"\rinternal".b)
    # => EncodingError: encoding index out of bound: 2147483647

## Acceptance criteria

- [ ] `Marshal.load` of a String or Symbol whose `encoding` ivar names an
      unset `internal` alias raises `EncodingError` with MRI's message, through
      a port of `rb_enc_find_index` (`vendor/ruby/v3.3.11/encoding.c`) that
      `sym2encidx` calls in place of `Encoding.find`.
- [ ] `marshal.trails.test.ts` covers it, and `sym2encidx`'s JSDoc drops the
      sentence comparing it to `Encoding.find`.
