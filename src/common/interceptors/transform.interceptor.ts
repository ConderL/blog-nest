import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResultDto } from '../dtos/result.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResultDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResultDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果响应已经是ResultDto格式，直接返回
        if (data && data.flag !== undefined && data.code !== undefined && data.msg !== undefined) {
          return data;
        }
        // 否则，包装成ResultDto格式
        return ResultDto.success(data);
      }),
    );
  }
}
