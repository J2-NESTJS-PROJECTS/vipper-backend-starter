import { HttpException, HttpStatus } from '@nestjs/common';

export class SapException extends HttpException {
  constructor(message: string, rfcFunction?: string, sapError?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'SAP RFC Error',
        message,
        rfcFunction,
        sapError: sapError?.message || sapError,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class SapConnectionException extends HttpException {
  constructor(message = 'Could not connect to SAP system') {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'SAP Connection Error',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
