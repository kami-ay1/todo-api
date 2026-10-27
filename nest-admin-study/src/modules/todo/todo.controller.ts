import { Body, Controller, Post } from '@nestjs/common';

/** 接收 Todo 相关的 HTTP 请求。 */
@Controller('todos')
export class TodoController {
  /** 接收任务内容并返回，检查数据传输结果。 */
  @Post()
  create(@Body() body: { value: string }) {
    return {
      value: body.value,
    };
  }
}
