import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateNegotiationDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  // Deprecated: the server derives the vendor from the product; kept optional
  // so older clients that still send it don't fail validation.
  @IsString()
  @IsOptional()
  vendorId?: string;

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
