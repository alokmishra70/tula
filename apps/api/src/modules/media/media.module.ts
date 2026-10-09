import { Module } from '@nestjs/common';
import { Clock } from '../../common/clock';
import { AppConfig } from '../../config/app-config';
import { LocalMediaController } from './local-media.controller';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalDiskStorage } from './storage/local-disk.storage';
import { ObjectStorage } from './storage/object-storage';
import { SupabaseStorage } from './storage/supabase.storage';

@Module({
  controllers: [MediaController, LocalMediaController],
  providers: [
    MediaService,
    {
      provide: ObjectStorage,
      inject: [AppConfig, Clock],
      useFactory: ({ storage }: AppConfig, clock: Clock): ObjectStorage =>
        storage.driver === 'supabase'
          ? new SupabaseStorage(storage, clock)
          : new LocalDiskStorage(storage, clock),
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
