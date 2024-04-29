import type { Child, FC } from 'hono/jsx';
import Docs from './Docs.js';

const Layout: FC<{ children: Child; title?: string }> = ({ children, title }) => {
  return (
    <html className="w-screen h-screen">
      <head>
        <title>{title ?? 'Hono API'}</title>
        {import.meta.env.PROD ? (
          <link href="/static/app.css" rel="stylesheet" />
        ) : (
          <link href="/src/app.css" rel="stylesheet" />
        )}
      </head>
      <body className="flex flex-col w-screen h-screen">
        <Docs>{children}</Docs>
      </body>
    </html>
  );
};

export default Layout;
