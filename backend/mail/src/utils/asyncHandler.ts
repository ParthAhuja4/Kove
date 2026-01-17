import { Request, Response, NextFunction } from "express";

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    }
  };
}

export default asyncHandler;
