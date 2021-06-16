import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawDataDetailEntity, RawDataEntity, SurveyDetailEntity, SurveyEntity } from './entities/survey.entity';
import { UserEntity } from './entities/user.entity';
import { SurveyResolver } from './resolvers/survey.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { SmsService } from './services/sms.service';
import { UserService } from './services/user.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
      debug: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      installSubscriptionHandlers: true,
      context: ({ req }) => {
        return { req };
      },
      cors: {
        credentials: true,
        origin: true,
      },
    }),
    JwtModule.register({ secret: 'XASKAJKSJAHJAHGAFGUIOP2OI2YY' }),
    TypeOrmModule.forFeature([
      UserEntity,
      SurveyEntity,
      SurveyDetailEntity,
      RawDataDetailEntity,
      RawDataEntity
    ]),
    ConfigModule.forRoot()
  ],
  providers: [
    UserResolver,
    SurveyResolver,
    UserService,
    SmsService
  ],
})
export class AppModule {}
