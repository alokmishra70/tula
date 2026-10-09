import { Module } from '@nestjs/common';
import { BiomarkerRepository, PrismaBiomarkerRepository } from './biomarker.repository';
import { MarkerQueryService } from './marker-query.service';

@Module({
  providers: [
    MarkerQueryService,
    { provide: BiomarkerRepository, useClass: PrismaBiomarkerRepository },
  ],
  exports: [MarkerQueryService, BiomarkerRepository],
})
export class MarkersModule {}
