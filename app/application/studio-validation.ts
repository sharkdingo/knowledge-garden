export class StudioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioValidationError";
  }
}

export class StudioConflictError extends Error {
  constructor(resourceLabel = "内容") {
    super(`${resourceLabel}已被其他会话更新。请刷新页面，比较新内容后再保存。`);
    this.name = "StudioConflictError";
  }
}
