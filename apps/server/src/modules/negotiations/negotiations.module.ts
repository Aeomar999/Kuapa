import { Module } from "@nestjs/common";
import { NegotiationsController } from "./negotiations.controller";
import { NegotiationsService } from "./negotiations.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { AgriSmsService } from "../../common/services/sms.service";

@Module({
  imports: [PrismaModule],
  controllers: [NegotiationsController],
  providers: [NegotiationsService, AgriSmsService],
  exports: [NegotiationsService],
})
export class NegotiationsModule {}
