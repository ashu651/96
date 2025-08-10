# Snapzy API

A modern, scalable social media platform API built with NestJS, Prisma, and PostgreSQL.

## Features

### 🔐 Authentication & Authorization
- User registration with email verification
- JWT-based authentication (access + refresh tokens)
- Password reset functionality
- Account deactivation
- Role-based access control

### 👥 User Management
- User profiles with customizable avatars and bios
- Username uniqueness validation
- Password change functionality
- User search and discovery
- Follow/unfollow system
- Account privacy controls

### 📧 Email Services
- Email verification for new accounts
- Password reset emails
- Welcome emails for new users
- SendGrid integration ready

### 🗄️ Database & Caching
- PostgreSQL with Prisma ORM
- Redis for caching and sessions
- Optimized queries with proper indexing
- Database migrations and seeding

### 🛡️ Security Features
- Argon2 password hashing
- Rate limiting
- CORS configuration
- Input validation and sanitization
- JWT token security

### 📚 API Documentation
- Swagger/OpenAPI documentation
- Comprehensive endpoint documentation
- Request/response examples
- Authentication examples

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Password Hashing**: Argon2

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd snapzy-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb snapzy_db
   
   # Run migrations
   npx prisma migrate dev
   
   # Generate Prisma client
   npx prisma generate
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT signing
- `SENDGRID_API_KEY`: SendGrid API key for emails
- `SENDGRID_FROM_EMAIL`: Sender email address

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/verify-email/:token` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user info

### Users
- `GET /users/search` - Search users
- `GET /users/:id` - Get user by ID
- `GET /users/username/:username` - Get user by username
- `PUT /users/profile` - Update user profile
- `PUT /users/change-password` - Change password
- `GET /users/:id/followers` - Get user followers
- `GET /users/:id/following` - Get user following
- `POST /users/:id/follow` - Follow a user
- `DELETE /users/:id/follow` - Unfollow a user
- `GET /users/:id/is-following` - Check follow status
- `DELETE /users/deactivate` - Deactivate account

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `follows` - User follow relationships
- `posts` - User posts (planned)
- `comments` - Post comments (planned)
- `likes` - Post likes (planned)

### Key Relationships
- Users can follow other users (many-to-many via follows table)
- Posts belong to users (planned)
- Comments belong to posts and users (planned)

## Development

### Project Structure
```
src/
├── auth/           # Authentication module
├── users/          # User management module
├── prisma/         # Database configuration
├── email/          # Email services
├── redis/          # Redis services
├── config/         # Configuration management
├── common/         # Shared utilities
└── main.ts         # Application entry point
```

### Available Scripts
- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

### Code Style
- Follow NestJS conventions
- Use TypeScript strict mode
- Implement proper error handling
- Add comprehensive logging
- Write unit tests for services
- Document all public APIs

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Docker
```bash
# Build image
docker build -t snapzy-api .

# Run container
docker run -p 3000:3000 snapzy-api
```

### Environment
- Set `NODE_ENV=production`
- Configure production database and Redis URLs
- Set strong JWT secrets
- Configure CORS origins
- Enable rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api` endpoint
- Review the code examples in the repository