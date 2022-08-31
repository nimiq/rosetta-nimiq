#!/bin/bash

mkdir -p dist
rm dist/*

deno compile --target x86_64-unknown-linux-gnu  --output dist/rosetta-linux         --allow-net --allow-read src/mod.ts
deno compile --target x86_64-pc-windows-msvc    --output dist/rosetta-windows       --allow-net --allow-read src/mod.ts
deno compile --target x86_64-apple-darwin       --output dist/rosetta-apple-x86     --allow-net --allow-read src/mod.ts
deno compile --target aarch64-apple-darwin      --output dist/rosetta-apple-aarch   --allow-net --allow-read src/mod.ts
