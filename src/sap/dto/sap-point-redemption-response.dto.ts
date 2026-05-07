export class SapPointRedemptionResponseDto {
  success: boolean;
  sapReference?: string | null;
  message: string;
  remainingPoints?: number | null;
  raw?: Record<string, any>;
}
