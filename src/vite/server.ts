import type { Plugin, PluginOption } from 'vite';
import devServer, { defaultOptions as devServerDefaultOptions, type DevServerOptions } from '@hono/vite-dev-server';
import tsconfigPaths from 'vite-tsconfig-paths';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { config } from 'dotenv';

config();

export const defaultOptions = {
  entry: '/src/app.ts',
  envPrefix: 'HS_',
};

export type Options = {
  entry?: string;
  envPrefix?: string;
  devServer?: DevServerOptions;
  external?: string[];
};

export function honoRest(options?: Options): PluginOption[] {
  const plugins: PluginOption[] = [];

  const entry = options?.entry ?? defaultOptions.entry;

  plugins.push(tsconfigPaths());
  plugins.push(
    mdx({
      jsxImportSource: 'hono/jsx',
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    })
  );
  plugins.push(
    devServer({
      entry,
      exclude: [...devServerDefaultOptions.exclude, /^\/src\/.+/, /^\/favicon.ico/, /^\/static\/.+/],
      ...options?.devServer,
    })
  );
  plugins.push(restartOnAddUnlink());

  return [
    {
      name: 'honor-vite-config',
      config: () => {
        const env: Record<string, string> = {};

        for (const [key, value] of Object.entries(process?.env ?? {})) {
          if (key.startsWith('HS_') || key.startsWith('HC_')) {
            env[`import.meta.env.${key}`] = `"${value}"`;
          }
        }

        return {
          define: env,
          envPrefix: options?.envPrefix ?? defaultOptions.envPrefix,
          ssr: {
            noExternal: true,
          },
        };
      },
    },
    ...plugins,
  ];
}

export function restartOnAddUnlink(): Plugin {
  return {
    name: 'restart-on-add-unlink',
    configureServer(server) {
      server.watcher.add('/app/**');
      server.watcher.on('add', async () => {
        await server.restart();
      });
      server.watcher.on('unlink', async () => {
        await server.restart();
      });
    },
  };
}
