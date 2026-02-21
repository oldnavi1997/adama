import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export function validateBody(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
