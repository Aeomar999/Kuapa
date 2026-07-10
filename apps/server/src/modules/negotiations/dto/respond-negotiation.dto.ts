import { IsEnum, IsOptional, IsString } from "class-validator";
import { NegotiationStatus } from "@prisma/client";

export class RespondNegotiationDto {
  @IsEnum(NegotiationStatus)
  status: NegotiationStatus;

  @IsString()
  @IsOptional()
  message?: string;
}
