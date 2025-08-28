export class ApiResponseDto<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
  }

  static success<T>(data?: T, message = '操作成功'): ApiResponseDto<T> {
    return new ApiResponseDto(200, message, data);
  }

  static error(message = '操作失败', code = 500): ApiResponseDto {
    return new ApiResponseDto(code, message);
  }
}

export class PaginatedResponseDto<T> {
  code: number;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: number;

  constructor(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = '查询成功'
  ) {
    this.code = 200;
    this.message = message;
    this.data = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
    this.timestamp = Date.now();
  }
}