import Header from './Header.js';
import Sidebar from './Sidebar.js';
import Content from './Content.js';
import Footer from './Footer.js';
import type { PropsWithChildren } from 'hono/jsx';

export default ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header />
      <main>
        <Sidebar />
        <Content>{children}</Content>
      </main>
      <Footer />
    </>
  );
};
