---
title: "mail: credit the 17 tests lost to duplicate names, loop titles and escaped quotes"
status: done
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: mail
packages: [mail, scripts]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10527
claim: "2026-11-21T21:31:42Z"
assignee: "action-pack-assertions-park-criterion-drops-builder-three"
blocked-by: null
closed-reason: null
---

## Context

17 mail specs read as missing: duplicate-named tests in other describes
(`vendor/mail/2.8.1/spec/mail/encodings_spec.rb:134/272/346`, `:148/:483`),
`<expr>` loop titles (`encoding_spec.rb:161`, `quoted_printable_spec.rb`), and
address titles containing `\"` (`address_spec.rb`).

## Acceptance criteria

- [ ] Each test sits under the describe matching its upstream context.
- [ ] Loop titles are literal or extractor-readable; escaped-quote titles normalise on both sides.
- [ ] `parity:test --missing` shows no mail rows; no test name is reworded.
- [ ] If the operator rules the two unique-boundary specs
      (`vendor/mail/2.8.1/lib/mail/mail.rb:243-260`) PERMANENT, reword their
      receipt: red under MRI only in isolation, as `@@uniq` seeds at -6. If the
      ruling is to port them, port them so they pass in isolation.

## Verification

```sh
pnpm parity:test --missing --package mail  # 0 rows
```
