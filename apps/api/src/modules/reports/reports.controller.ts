import { Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  AddBiomarkerRequestSchema,
  RegisterReportRequestSchema,
  UpdateBiomarkerRequestSchema,
  type AddBiomarkerRequest,
  type Biomarker,
  type RegisterReportRequest,
  type ReportDetail,
  type ReportSummary,
  type UpdateBiomarkerRequest,
} from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodBody } from '../../common/decorators/request.decorators';
import { AiRateLimited } from '../../common/throttling/throttling';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('reports')
  @AiRateLimited()
  register(
    @CurrentUser() user: RequestUser,
    @ZodBody(RegisterReportRequestSchema) body: RegisterReportRequest,
  ): Promise<ReportSummary> {
    return this.reports.register(user, body);
  }

  @Get('reports')
  list(@CurrentUser() user: RequestUser): Promise<ReportSummary[]> {
    return this.reports.list(user.id);
  }

  @Get('reports/:id')
  detail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetail> {
    return this.reports.detail(user.id, id);
  }

  @Post('reports/:id/biomarkers')
  addBiomarker(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(AddBiomarkerRequestSchema) body: AddBiomarkerRequest,
  ): Promise<Biomarker> {
    return this.reports.addBiomarker(user, id, body);
  }

  @Patch('biomarkers/:id')
  updateBiomarker(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(UpdateBiomarkerRequestSchema) body: UpdateBiomarkerRequest,
  ): Promise<Biomarker> {
    return this.reports.updateBiomarker(user, id, body);
  }
}
