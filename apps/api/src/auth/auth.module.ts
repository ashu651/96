import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UsersModule,
    EmailModule,
    RedisModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}