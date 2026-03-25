import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: context.switchToHttp().getResponse<{ statusCode: number }>().statusCode,
        data: this.serialize(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private serialize(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serialize(item));
    }

    if (value instanceof Date || value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, this.serialize(item)]),
      );
    }

    return value;
  }
}
