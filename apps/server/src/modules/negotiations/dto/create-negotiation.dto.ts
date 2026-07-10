import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateNegotiationDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsNumber()
  @IsPositive()
  proposedPrice: number;

  @IsNumber()
  @IsPositive()
  proposedQuantity: number;

  @IsString()
  @IsOptional()
  message?: string;
}
