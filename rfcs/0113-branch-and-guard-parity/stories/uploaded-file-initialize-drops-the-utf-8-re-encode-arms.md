---
title: "UploadedFile#initialize drops the UTF-8 re-encode arms for filename and headers"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `UploadedFile#initialize` drops the UTF-8 re-encode arms for filename and headers

## Context

`ActionDispatch::Http::UploadedFile#initialize`
(`vendor/rails/actionpack/lib/action_dispatch/http/upload.rb:36-58`) does more
than copy `hash[:filename]` and `hash[:head]` across. Each of the two branches
is a `dup` followed by a begin/rescue pair:

```ruby
if hash[:filename]
  @original_filename = hash[:filename].dup

  begin
    @original_filename.encode!(Encoding::UTF_8)
  rescue EncodingError
    @original_filename.force_encoding(Encoding::UTF_8)
  end
else
  @original_filename = nil
end
```

and the same shape again for `@headers` (`upload.rb:49-58`).

trails' `packages/actionpack/src/action-dispatch/http/upload.ts` keeps the
outer `if`/`else` but assigns the value straight through, so both rescue arms
and both `encode!` calls are missing. #7573 converged the rest of the class
onto its Rails one-liners and left these two arms as they were.

The four Rails tests that name this behaviour —
`test_filename_should_be_in_utf_8`, `test_filename_should_always_be_in_utf_8`,
`test_headers_should_be_in_utf_8`, `test_headers_should_always_be_in_utf_8`
(`vendor/rails/actionpack/test/dispatch/uploaded_file_test.rb:26-56`) — assert
`original_filename.encoding.to_s == "UTF-8"` after being handed a
SHIFT_JIS-encoded or ASCII-8BIT-encoded String. Our mirrors of those four
tests assert the value round-trips, which passes without the arms and so pins
nothing.

## Converged shape

Both branches route the value through `@blazetrails/ruby-compat`'s `Encoding`
surface the way `upload.rb:39-43` does: attempt the UTF-8 encode, and on the
encoding error fall back to reinterpreting the bytes as UTF-8. The trails
`Encoding` port already carries the pieces (`packages/ruby-compat/src/encoding.ts`);
`EncodingError` is `packages/ruby-compat/src/encoding-error.ts`.

The four mirror tests then assert the resulting encoding rather than the
value, so the arms are pinned.

## Acceptance criteria

- `initialize`'s `filename` and `head` branches each carry the `encode!` /
  `rescue EncodingError` → `force_encoding` pair `upload.rb:39-43,52-56`
  spells.
- The four `*_should_be_in_utf_8` / `*_should_always_be_in_utf_8` mirror tests
  in `packages/actionpack/src/action-dispatch/dispatch/uploaded-file.test.ts`
  assert the encoding, and fail on the pre-change implementation.
