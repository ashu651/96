import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    RedisModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}