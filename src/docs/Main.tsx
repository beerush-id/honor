import type { Child, FC } from 'hono/jsx';
import Docs from './Docs.js';
import css from './styles/honor.css?url';
import js from './styles/honor.helper.js?url';

const Layout: FC<{ children: Child; title?: string }> = ({ children, title }) => {
  return (
    <html className="w-screen h-screen">
      <head>
        <title>{title ?? 'Hono API'}</title>
        <link href={css} rel="stylesheet" />
        <script src={js}></script>
      </head>
      <body className="flex flex-col w-screen h-screen">
        <button>Click Me!</button>
        <Docs>{children}</Docs>
      </body>
    </html>
  );
};

export default Layout;
