class ApiResponse {
  public readonly statusCode: number;
  public readonly data: object | null;
  public readonly message: string;
  public readonly success: boolean;

  constructor(
    statusCode: number,
    data: object | null,
    message: string = "Success",
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
