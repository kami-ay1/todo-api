import { Module } from '@nestjs/common';
import { TodoModule } from './modules/todo/todo.module';
/** 学习工程的根模块，负责注册当前练习的 Controller 和 Provider。 */
@Module({
  imports:[TodoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
