import fs from 'fs';
import { $ } from 'bun';

async function build() {
  console.log('Building cld...');

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  await $`bun build src/index.ts --outfile dist/cld --banner '#!/usr/bin/env bun' --target bun --minify`;
  await $`chmod +x dist/cld`;

  console.log('Build complete: dist/cld');
}

build();
