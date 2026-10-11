# Backend REST API

Node.js and Express REST API with Prisma ORM for Neon PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your Neon database connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
PORT=3000
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio for database management

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API welcome message
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user by ID
- `POST /api/users` - Create new user (body: `{ name, email }`)
- `PUT /api/users/:id` - Update user (body: `{ name, email }`)
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
backend/
├── index.js              # Main server file
├── prisma/
│   └── schema.prisma     # Prisma schema
├── routes/
│   └── index.js          # API routes
├── middleware/
│   └── errorHandler.js   # Error handling middleware
├── .env                  # Environment variables
└── package.json          # Dependencies and scripts
```

## Neon Database Connection

This project is configured to use Neon PostgreSQL. Make sure to:

1. Create a Neon project at https://neon.tech
2. Get your connection string from the Neon dashboard
3. Update the `DATABASE_URL` in your `.env` file
4. Run migrations to set up your database schema
