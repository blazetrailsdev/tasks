---
title: "Image.open URL arm: port OpenURI::OpenRead#open"
status: done
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9396
claim: "2026-10-28T11:49:07Z"
assignee: "mini-magick-image-hash-sync-over-async-signature"
blocked-by: null
closed-reason: null
---

## Context

`MiniMagick::Image.open`'s URL arm (`vendor/mini_magick/v5.2.0/lib/mini_magick/image.rb`,
`self.open`) is `uri = URI(path_or_url)` then `uri.open(options) { |file| read(file, ext) }`,
which is `OpenURI::OpenRead#open` (`vendor/ruby/v3.3.11/lib/open-uri.rb`).
After trails#9388, `packages/mini-magick/src/image.ts` `static open` builds the URI with
`URI.parse(String(pathOrUrl))`, but ruby-compat's `URI::Generic` / `HTTP`
(`packages/ruby-compat/src/uri/`) has no `open`, and `open-uri.ts` ports only
`OpenURI::HTTPError`. So opening an http(s)/ftp URL raises a `TypeError`.

## Acceptance criteria

- ruby-compat ports `OpenURI::OpenRead#open` for HTTP/HTTPS (async fetch, yields a
  Tempfile/StringIO-like IO), with MRI citations.
- `Image.open("https://...")` reads the image, and the image_spec's URL examples are
  ported under their spec names.
