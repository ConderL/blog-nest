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
    let msg: string | string[] = message;

    if (exception instanceof UnauthorizedException) {
      code = StatusCodeEnum.UNAUTHORIZED;
    } else if (exception instanceof BadRequestException) {
      code = StatusCodeEnum.VALID_ERROR;
      // 处理验证错误，提取详细错误信息
      if (errorResponse) {
        // 处理自定义Error返回的情况
        if (errorResponse.message instanceof Error) {
          msg = errorResponse.message.message;
        }
        // 处理数组形式的错误信息
        else if (Array.isArray(errorResponse.message)) {
          msg = errorResponse.message.join(', ');
        }
        // 处理字符串形式的错误信息
        else if (typeof errorResponse.message === 'string') {
          msg = errorResponse.message;
        }
        // 处理对象形式的错误信息
        else if (typeof errorResponse.message === 'object' && errorResponse.message !== null) {
          try {
            msg = JSON.stringify(errorResponse.message);
          } catch (e) {
            msg = '请求参数验证失败';
          }
        }
        // 默认错误信息
        else if (errorResponse.error === 'Bad Request') {
          msg = '请求参数验证失败';
        }
        this.logger.debug(`验证错误详情: ${JSON.stringify(errorResponse)}`);
      }
    } else if (exception instanceof ForbiddenException) {
      code = StatusCodeEnum.FAIL;
    } else if (exception instanceof InternalServerErrorException) {
      code = StatusCodeEnum.SYSTEM_ERROR;
    }

    // 将数组转换为字符串
    const messageStr = Array.isArray(msg) ? msg.join(', ') : msg;

    // 使用ResultDto格式返回错误信息
    const resultDto = ResultDto.fail(messageStr, code);

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
    let message: any = '服务器内部错误';
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as any;
      message = errorResponse?.message || exception.message;
      if (message instanceof Error) {
        message = message.message;
      } else if (typeof message === 'object' && message !== null) {
        try {
          message = JSON.stringify(message);
        } catch (e) {
          message = exception.message || '服务器内部错误';
        }
      }
    } else if (exception?.message) {
      message = exception.message;
    }

    // 确保最终返回的是字符串类型
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    // 使用ResultDto格式返回错误信息
    const resultDto = ResultDto.fail(messageStr, StatusCodeEnum.SYSTEM_ERROR);

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${messageStr}`,
      exception.stack,
    );

    response.status(status).json(resultDto);
  }
}
