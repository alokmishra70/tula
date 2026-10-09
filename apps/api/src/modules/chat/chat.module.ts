import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { MarkersModule } from '../markers/markers.module';
import { MealsModule } from '../meals/meals.module';
import { ProfileModule } from '../profile/profile.module';
import { ChatMessageRepository, PrismaChatMessageRepository } from './chat-message.repository';
import { ChatToolbox } from './chat-tools';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ProfileModule, GoalsModule, MealsModule, MarkersModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatToolbox,
    { provide: ChatMessageRepository, useClass: PrismaChatMessageRepository },
  ],
})
export class ChatModule {}
