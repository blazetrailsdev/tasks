---
title: "rack: static files with non-ASCII bytes are served corrupted and truncated"
status: done
updated: 2026-10-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 120
priority: 0
pr: trails#8634
claim: "2026-10-07T14:56:10Z"
assignee: "static-files-with-non-ascii-bytes-are-served-corrupted-and-truncated"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap in production (trails pin `9e17ddc98d`; unchanged on `main` at `c0277ef35a`).
Every static file that contains a non-ASCII byte is served corrupted and cut short.

`Rack::Files` reads the file in binary mode and yields it as a binary string, one JS char per byte
(`packages/rack/src/files.ts:27-35`, `File.open(this.path, "rb", ...)`, and `eachRangePart` at
`:71-82`), and sets `content-length` to the file's byte size (`:171-174`). `Handler.Node` then
writes each chunk with `res.write(chunk)` (`packages/rack/src/handler/node.ts:95-97`). Node encodes
a string argument as UTF-8, so every byte at or above 0x80 goes out as two bytes; the response is
longer than `content-length`, and the client keeps only the first `content-length` bytes.

Observed on the live trailmap (`/assets/javascripts/fleet-format.js`, 19,760 bytes on disk): an
em dash in a comment arrives as `â` followed by two stray bytes, and the response ends mid-statement
at `String(f.erro`, so the module does not parse and the page's script never runs. The stylesheet
loses its last rules the same way. A file of pure ASCII is unaffected, which is why it went
unnoticed. Development is unaffected because Vite serves assets there.

Rails: `Rack::Files::Iterator#each` (`vendor/rack/lib/rack/files.rb`) yields `ASCII-8BIT` strings
and every Ruby server writes a string's bytes, so the body is the file. The port has two kinds of
string on one path, a binary string from `File#read` in `rb` mode and a Unicode string from a view,
and the handler writes both as UTF-8.

The application has no workaround: the files are correct on disk.

## Expected shape

A response body's bytes are the bytes its producer meant. Either the file iterator yields bytes
(`Uint8Array`) and the handler writes them untouched, or a body chunk carries its encoding the way
ruby-compat strings elsewhere do and the handler writes a binary string as `latin1`.
`content-length` then matches what is written.

## Acceptance criteria

- [ ] A test through a real listening `Handler.Node`: a static file containing multi-byte UTF-8 (and one containing arbitrary bytes, e.g. a PNG) is received byte-identical, with `content-length` equal to the bytes received.
- [ ] A rendered view containing non-ASCII text is still received as UTF-8.
- [ ] A range request over such a file returns exactly the requested bytes.
