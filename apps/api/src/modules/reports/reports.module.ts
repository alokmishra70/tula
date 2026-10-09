import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { MarkersModule } from '../markers/markers.module';
import { MediaModule } from '../media/media.module';
import { ProfileModule } from '../profile/profile.module';
import { PrismaReportRepository, ReportRepository } from './report.repository';
import { ReportExtractionService } from './report-extraction.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [GoalsModule, MarkersModule, MediaModule, ProfileModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportExtractionService,
    { provide: ReportRepository, useClass: PrismaReportRepository },
  ],
})
export class ReportsModule {}
