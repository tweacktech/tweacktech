import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentsModule } from './payments/payments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { BlogModule } from './blog/blog.module';
import { SupportModule } from './support/support.module';
import { MediaModule } from './media/media.module';
import { JobsModule } from './jobs/jobs.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ChatModule } from './chat/chat.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { CalendarModule } from './calendar/calendar.module';
import { TalentModule } from './talent/talent.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './common/services/prisma.module';
import { MailModule } from './common/services/mail.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SeedersModule } from './seeders/seeders.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { RealtimeModule } from './realtime/realtime.module';
import { InvitationsModule } from './invitations/invitations.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ActivityModule } from './activity/activity.module';
import { ActivityInterceptor } from './activity/activity.interceptor';
import { AttendanceModule } from './attendance/attendance.module';
import { MentorsModule } from './mentors/mentors.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ActivityModule,
    MailModule,
    RealtimeModule,
    NotificationsModule,
    HealthModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CurrenciesModule,
    CoursesModule,
    InvitationsModule,
    IntegrationsModule,
    EnrollmentsModule,
    PaymentsModule,
    CertificatesModule,
    BlogModule,
    SupportModule,
    MediaModule,
    JobsModule,
    AssignmentsModule,
    ChatModule,
    ChatbotModule,
    CalendarModule,
    TalentModule,
    AttendanceModule,
    MentorsModule,
    AiModule,
    SeedersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule {}
