import { Module } from '@nestjs/common';
import { RecentlyViewedService } from './recently-viewed.service';

@Module({
  providers: [RecentlyViewedService],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
