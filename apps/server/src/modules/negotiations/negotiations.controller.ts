import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { NegotiationsService } from "./negotiations.service";
import { CreateNegotiationDto } from "./dto/create-negotiation.dto";
import { RespondNegotiationDto } from "./dto/respond-negotiation.dto";

@ApiBearerAuth()
@Controller("negotiations")
@UseGuards(AuthGuard)
@ApiTags("Negotiations")
export class NegotiationsController {
  constructor(private readonly negotiationsService: NegotiationsService) {}

  @ApiOperation({ summary: "Submit a price negotiation offer for bulk agricultural produce" })
  @Post()
  create(@Req() req: any, @Body() dto: CreateNegotiationDto) {
    return this.negotiationsService.createNegotiation(req.user.id, dto);
  }

  @ApiOperation({ summary: "Get all negotiations sent by current buyer" })
  @Get("buyer")
  findBuyerNegotiations(@Req() req: any) {
    return this.negotiationsService.findBuyerNegotiations(req.user.id);
  }

  @ApiOperation({ summary: "Get all incoming price negotiations for a farmer/vendor" })
  @Get("vendor/:vendorId")
  findVendorNegotiations(@Param("vendorId") vendorId: string) {
    return this.negotiationsService.findVendorNegotiations(vendorId);
  }

  @ApiOperation({ summary: "Accept, Reject, or Counter a price negotiation" })
  @Patch(":id/respond")
  respond(@Param("id") id: string, @Body() dto: RespondNegotiationDto) {
    return this.negotiationsService.respondToNegotiation(id, dto);
  }
}
