# @beerush/honor

Honor is a REST API framework built on top of Hono.

> This project is still in early development.

## 🏠 Getting Started

To start using Honor quickly, you can clone the starter package:

```bash
git clone git@github.com:beerush-id/honor-starter.git
```

Install dependencies:

```bash
bun install
```

or

```bass
npm install
```

or

```bash
yarn install
```

To run:

```bash
bun dev
```

## ⛩️ Features

- File based routing inspired by SvelteKit.
- Handle REST routing by exporting config.
- Handle routing by exporting a function.
- REST API, Documentation, and Client routing.
- Middleware support.

## 📚 Documentation

### CRUD Routing

Creating a REST API is easy with Honor. You can create a REST API by exporting a config object.

```typescript
// src/routes/posts/+server.ts
import type { Endpoint } from '@beerush/honor/supabase';
import { z } from '@beerush/honor';

const schema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
});

export default ({
  name: 'post',
  table: 'Posts',
  schema,
}) satisfies Endpoint;
```

After creating the config object, you can access the REST API at:

- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/:id`
- `PUT /api/posts/:id`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`

### Single Routing.

You can also create a custom routing by exporting a function as default.

```typescript
// src/routes/+server.ts
import type { ReadHandler } from '@beerush/honor';

export default (async () => {
  return {
    status: 'Ok',
  };
}) satisfies ReadHandler;

```

To handle non GET request, you can use the `method` property.

```typescript
// src/routes/+server.ts
import type { WriteHandler } from '@beerush/honor';

export const POST = (async (c) => {
  return {
    id: crypto.randomUUID(),
    ...c.body,
  };
}) satisfies WriteHandler;

```

After creating the above functions, you can access the custom API at:

- `GET /api`
- `POST /api`

### Documentations.

By default, Honor will generate a documentation for your API. You can access the documentation at `/docs`.

To add documentation details for your API, you can add `+server.mdx` file.

```mdx
// src/routes/+server.mdx
# My API Documentation
```

### Client Routing

You can also create a client routing by exporting a function as default using JSX, or simply MDX.

```tsx
// src/routes/+page.tsx
export default () => (
  <div>
    <h1>Hello, World! < /h1>
  < /div>
);
```

```mdx
// src/routes/+page.mdx
# Hello, World!
```

### Client Layout

You can also create a client layout by exporting a function as default using JSX.

```tsx
// src/routes/+layout.tsx
export default ({ children }) => (
  <div>
    <header>
      <h1>My Blog</h1>
    </header>
    <main>
      { children }
    </main>
  </div>
);
```

Visit the page at `/`, you will see the content of the page.

## 👏 Credits

- This project was created using `bun init` in bun v1.1.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript
  runtime.
- This project is built on top of [Hono](https://hono.dev).
- Inspired by [SvelteKit](https://kit.svelte.dev).
