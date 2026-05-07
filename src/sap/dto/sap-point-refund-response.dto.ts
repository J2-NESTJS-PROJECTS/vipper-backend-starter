export class SapPointRefundResponseDto {
  success: boolean;
  sapReference?: string | null;
  message: string;
  remainingPoints?: number | null;
  raw?: Record<string, any>;
}
