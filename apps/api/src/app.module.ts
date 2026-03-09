import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BlockModule } from './block/block.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StorageModule } from './storage/storage.module';
import { NoteModule } from './note/note.module';
import { TodoModule } from './todo/todo.module';

const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot(
      isTest
        ? [
            { name: 'short', ttl: 1000, limit: 1000 },
            { name: 'medium', ttl: 10000, limit: 1000 },
            { name: 'long', ttl: 60000, limit: 1000 },
          ]
        : [
            { name: 'short', ttl: 1000, limit: 3 },
            { name: 'medium', ttl: 10000, limit: 20 },
            { name: 'long', ttl: 60000, limit: 100 },
          ],
    ),
    PrismaModule,
    AuthModule,
    BlockModule,
    UsersModule,
    StorageModule,
    NoteModule,
    TodoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
