/**
 * 状态码枚举
 */
export enum StatusCodeEnum {
  /**
   * 操作成功
   */
  SUCCESS = 200,

  /**
   * 参数错误
   */
  VALID_ERROR = 400,

  /**
   * 未登录
   */
  UNAUTHORIZED = 402,

  /**
   * 系统异常
   */
  SYSTEM_ERROR = -1,

  /**
   * 操作失败
   */
  FAIL = 500,
}

/**
 * 状态码消息
 */
export const StatusCodeMessage = {
  [StatusCodeEnum.SUCCESS]: '操作成功',
  [StatusCodeEnum.VALID_ERROR]: '参数错误',
  [StatusCodeEnum.UNAUTHORIZED]: '未登录',
  [StatusCodeEnum.SYSTEM_ERROR]: '系统异常',
  [StatusCodeEnum.FAIL]: '操作失败',
};
