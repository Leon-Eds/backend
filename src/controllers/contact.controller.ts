import { NextFunction, Request, Response } from "express";
import { ContactService } from "../services/contact.service";

export class ContactController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContactService.submit(req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
