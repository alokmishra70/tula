import { Module } from '@nestjs/common';
import { DeviceUserResolver } from '../../common/auth/device-user-resolver';
import { PrismaUserRepository } from './prisma-user.repository';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { RepositoryDeviceUserResolver } from './repository-device-user.resolver';
import { UserRepository } from './user.repository';
import { PrismaWeightRepository, WeightRepository } from './weight.repository';

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: WeightRepository, useClass: PrismaWeightRepository },
    { provide: DeviceUserResolver, useClass: RepositoryDeviceUserResolver },
  ],
  exports: [ProfileService, DeviceUserResolver],
})
export class ProfileModule {}
