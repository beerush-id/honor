import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./lib'],
  outDir: './src/lib',
  dts: true,
  splitting: false,
  minify: false,
  format: ['esm'],
  bundle: true,
  platform: 'browser',
});
