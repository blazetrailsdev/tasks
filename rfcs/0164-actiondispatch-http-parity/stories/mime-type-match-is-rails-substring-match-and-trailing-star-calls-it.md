---
title: "Mime::Type#match? is isMatch with Rails' substring body; parse_data_with_trailing_star calls it"
status: done
updated: 2026-10-14
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: trails#8909
claim: "2026-10-14T17:48:39Z"
assignee: "mime-type-match-is-rails-substring-match-and-trailing-star-calls-it"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8645. Rails' `Mime::Type#match?`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:317-321`) is

    return false unless mime_type
    regexp = Regexp.new(Regexp.quote(mime_type.to_s))
    @synonyms.any? { |synonym| synonym.to_s.match?(regexp) } || @string.match?(regexp)

trails' port (`packages/actionpack/src/action-dispatch/http/mime-type.ts:210`)
is spelled `match`, not `isMatch`, and has a different body: a `RegExp` arm, a
`"*/*"` arm, a `"type/*"` prefix arm, then exact equality against `string` and
`synonyms`. None of those arms is in Rails, and Rails' substring match is gone.

Because of that, `parse_data_with_trailing_star` (`mime_type.rb:236-238`,
`Mime::SET.select { |m| m.match?(type) }`) does not call it: `mime-type.ts`'s
`parseDataWithTrailingStar` inlines `m.string.includes(type) || m.synonyms.some(...)`.

## Acceptance criteria

- `Mime::Type#match?` is `isMatch(mimeType)` with Rails' three lines, nil guard included.
- `parseDataWithTrailingStar` is `MimeType.SET.select((m) => m.isMatch(type))`.
- Callers of the old `match` arms are converged onto what Rails calls at each site.
