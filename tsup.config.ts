import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src'],
  outDir: './dist',
  dts: true,
  splitting: false,
  minify: false,
  format: ['esm'],
  bundle: false,
  platform: 'browser',
});
