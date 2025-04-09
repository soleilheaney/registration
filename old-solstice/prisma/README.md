# Database Configuration

## Local Development

The project uses PostgreSQL for both development and production environments.

### Local PostgreSQL Setup

Make sure your local PostgreSQL server is configured with:

```
username: postgres
password: postgres
database: solstice
host: localhost
port: 5432
```

### Setup Instructions

1. Install PostgreSQL (if not already installed):
   ```bash
   brew install postgresql@17
   ```

2. Start PostgreSQL service:
   ```bash
   brew services start postgresql@17
   ```

3. Create database user and set password:
   ```bash
   createuser -s postgres
   psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" postgres
   ```

4. Create the application database:
   ```bash
   createdb -U postgres solstice
   ```

## Database URL

The application connects to the database using the following connection string in the `.env` file:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solstice?schema=public"
```

## Prisma Commands

- Generate Prisma client:
  ```bash
  npx prisma generate
  ```

- Run database migrations:
  ```bash
  npx prisma migrate dev
  ```

- Reset the database (for development):
  ```bash
  npx prisma migrate reset
  ```

- Open Prisma Studio (database GUI):
  ```bash
  npx prisma studio
  ```