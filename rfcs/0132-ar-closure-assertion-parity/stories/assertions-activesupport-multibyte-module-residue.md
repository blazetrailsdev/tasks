---
title: "assertions-activesupport-multibyte-module-residue"
status: closed
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: "duplicate of the module-class-remainder and string-ext-multibyte stories, which stay open"
---

## Context

Remainder of `assertions-activesupport-module-class-remainder` and
`assertions-activesupport-string-ext-multibyte-safe-buffer`. Every other file those
stories listed (concern, attribute_accessor\*, secure_random, introspection,
class/attribute, attr_internal, digest/uuid, concerning, file, kernel, remove_method,
attribute_aliasing, load_error, anonymous, descendants_tracker, class, duplicable,
safe_buffer) already reports 0 in `pnpm parity:test -- --assertions --package activesupport`.
Still divergent:

- `multibyte_chars_test.rb` (110) and `core_ext/string_ext_test.rb`
  `core ext adds mb chars`, `mb chars returns instance of proxy class`,
  `string should recognize utf8 strings`: there is no
  `ActiveSupport::Multibyte::Chars` port at all
  (`vendor/rails/activesupport/lib/active_support/multibyte/chars.rb`,
  `core_ext/string/multibyte.rb` `mb_chars` / `is_utf8?`). The trails tests are
  placeholders asserting `typeof str`.
- `core_ext/string_ext_test.rb` `truncates bytes preserves encoding` (String#encoding)
  and `string to datetime` (`DateTime#offset` / `#start`, `string_ext_test.rb:759-764`).
- `core_ext/module_test.rb` (16): `private delegate*` rows assert
  `assert_not_respond_to` on `private:`-delegated methods (`delegation.rb` `self.private`);
  `delegation to method that exists on nil*` rely on `NilClass#to_f`;
  `delegation line number` / `delegate line with nil` use `source_location`;
  `delegation arity to self class` asserts arity `-1` for `"..."` signatures
  (`delegation.rb:88-105`) and the port's `ArityTester` lacks the block/opt/kwargs members.
- `core_ext/name_error_test.rb` (4): `NameError#receiver`.

## Acceptance criteria

- `Multibyte::Chars` ported and `multibyte_chars_test.rb` converged, or each residual row
  carries a call-site comment naming the Ruby-only protocol.
- activesupport row of the assertion mark lowered; no test renames.
