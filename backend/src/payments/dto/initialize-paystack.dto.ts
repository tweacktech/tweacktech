import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitializePaystackDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * Accepted only for backwards compatibility with older clients and never
   * used to price the payment. The amount is always derived server-side from
   * the course price; a client-supplied amount cannot buy a course cheaply.
   */
  @IsOptional()
  @IsNumber()
  amount?: number;
}
