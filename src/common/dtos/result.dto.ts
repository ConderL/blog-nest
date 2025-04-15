import { ApiProperty } from '@nestjs/swagger';
import { StatusCodeEnum, StatusCodeMessage } from '../enums/status-code.enum';

export class ResultDto<T> {
  @ApiProperty({ description: '返回状态', example: true })
  flag: boolean;

  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '返回信息', example: '操作成功' })
  msg: string;

  @ApiProperty({ description: '返回数据' })
  data: T;

  /**
   * 成功返回
   */
  static success<T>(data?: T): ResultDto<T> {
    const result = new ResultDto<T>();
    result.flag = true;
    result.code = StatusCodeEnum.SUCCESS;
    result.msg = StatusCodeMessage[StatusCodeEnum.SUCCESS];
    result.data = data;
    return result;
  }

  /**
   * 失败返回
   */
  static fail<T>(msg: string, code: number = StatusCodeEnum.FAIL): ResultDto<T> {
    const result = new ResultDto<T>();
    result.flag = false;
    result.code = code;
    result.msg = msg;
    return result;
  }
}
