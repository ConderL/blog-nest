import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResultDto } from '../dtos/result.dto';
import { StatusCodeEnum } from '../enums/status-code.enum';

/**
 * HTTP异常过滤器
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const message = exception.message || '请求失败';
    const errorResponse = exception.getResponse() as any;

    // 设置适当的状态码
    let code = status;
    if (exception instanceof UnauthorizedException) {
      code = StatusCodeEnum.UNAUTHORIZED;
    } else if (exception instanceof BadRequestException) {
      code = StatusCodeEnum.VALID_ERROR;
    } else if (exception instanceof ForbiddenException) {
      code = StatusCodeEnum.FAIL;
    } else if (exception instanceof InternalServerErrorException) {
      code = StatusCodeEnum.SYSTEM_ERROR;
    }

    // 使用ResultDto格式返回错误信息
    const resultDto = ResultDto.fail(errorResponse?.message || message, code);

    // 记录错误日志，包含详细错误信息和堆栈
    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception.stack);

    response.status(status).json(resultDto);
  }
}

/**
 * 全局异常过滤器
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取状态码
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 确定错误消息
    let message = '服务器内部错误';
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as any;
      message = errorResponse?.message || exception.message;
    } else if (exception?.message) {
      message = exception.message;
    }

    // 使用ResultDto格式返回错误信息
    const resultDto = ResultDto.fail(message, StatusCodeEnum.SYSTEM_ERROR);

    // 记录错误日志
    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception.stack);

    response.status(status).json(resultDto);
  }
}
