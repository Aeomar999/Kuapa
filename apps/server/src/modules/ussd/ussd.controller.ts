import { Controller, Post, Body, HttpCode, HttpStatus, Header } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UssdService } from "./ussd.service";
import { UssdRequestDto } from "./dto/ussd.dto";

@ApiTags("ussd")
@Controller("ussd")
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post("gateway")
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "text/plain")
  @ApiOperation({ summary: "Main USSD gateway webhook for Arkesel / Hubtel / Africa's Talking" })
  @ApiResponse({ status: 200, description: "Plaintext USSD response starting with CON or END" })
  async handleGateway(@Body() dto: UssdRequestDto): Promise<string> {
    return this.ussdService.handleUssd(dto);
  }

  @Post("simulate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Simulate an interactive USSD session for development & demo" })
  async simulate(@Body() dto: UssdRequestDto): Promise<{ response: string; isComplete: boolean }> {
    const output = await this.ussdService.handleUssd(dto);
    const isComplete = output.startsWith("END");
    return {
      response: output,
      isComplete,
    };
  }
}
