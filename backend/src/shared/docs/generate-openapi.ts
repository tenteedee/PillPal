import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getOpenApiSpec } from './swagger.js';

const outputDir = resolve(process.cwd(), 'docs');
const outputPath = resolve(outputDir, 'openapi.json');

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(getOpenApiSpec(), null, 2)}\n`, 'utf-8');

process.stdout.write(`Generated OpenAPI doc: ${outputPath}\n`);
