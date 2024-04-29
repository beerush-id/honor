import type { Child, FC } from 'hono/jsx';
import Docs from './Docs.js';

const Layout: FC<{ children: Child; title?: string }> = ({ children, title }) => {
  return (
    <html className="w-screen h-screen">
      <head>
        <title>{title ?? 'Hono API'}</title>
        <style></style>
      </head>
      <body className="flex flex-col w-screen h-screen">
        <Docs>{children}</Docs>
      </body>
    </html>
  );
};

export default Layout;
