import type { Plugin, PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';

config();

type Options = {
  jsxImportSource?: string;
  assetsDir?: string;
};

export const defaultOptions: Options = {
  jsxImportSource: 'hono/jsx/dom',
  assetsDir: 'static',
};

export function client(options?: Options): PluginOption[] {
  return [
    tsconfigPaths(),
    css(),
    {
      name: 'honor-vite-client',
      config: () => {
        const env: Record<string, string> = {};

        for (const [key, value] of Object.entries(process?.env ?? {})) {
          if (key.startsWith('HC_')) {
            env[`import.meta.env.${key}`] = `"${value}"`;
          }
        }

        return {
          define: env,
          build: {
            rollupOptions: {
              input: ['/src/app.tsx'],
            },
            assetsDir: options?.assetsDir ?? defaultOptions.assetsDir,
            manifest: true,
          },
          esbuild: {
            jsxImportSource: options?.jsxImportSource ?? defaultOptions.jsxImportSource,
          },
        };
      },
    },
  ];
}

export function css(): Plugin {
  return {
    name: 'honor-vite-css',
    config: () => {
      return {
        build: {
          rollupOptions: {
            input: ['/src/app.css'],
            output: {
              assetFileNames: 'static/[name].[ext]',
            },
          },
          manifest: true,
        },
      };
    },
  };
}
