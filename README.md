# Prisma Convert

> Convert your Prisma 1.0 datamodel to Prisma 2.0

## Usage

```sh
npx prisma-converter <datamodel.graphql>
```

It turns your legacy datamodel specification into an upcoming Prisma 2 data model.

```graphql
type Post {
  id: ID! @id
  title: String!
  content: String
  author: User!
}

type User {
  id: ID! @id
  email: String! @unique
  name: String!
}
```

```prisma
datasource pg {
  provider = "postgres"
  url      = env("POSTGRESQL_URL")
}

generator photon {
  provider = "prisma-client-js"
}

model Post {
  id      String  @id @default(cuid())
  title   String
  content String?
  author  User
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
}
```

## Specification

- `1.x`: https://www.prisma.io/docs/datamodel-and-migrations/datamodel-MYSQL-knul/
- `2.x`: https://github.com/prisma/prisma2/blob/master/docs/data-modeling.md#models

## License

MIT @ Matic Zavadlal
