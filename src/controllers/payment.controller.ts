import { Response, NextFunction } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../types";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
  /**
   * Subscribe school to a plan
   */
  static async subscribe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School ID not found in token claims." });
      }

      const { planId, callbackUrl } = req.body;
      if (!planId) {
        return res.status(400).json({ success: false, message: "planId is required." });
      }

      // Default callback URL if not provided
      const finalCallbackUrl = callbackUrl || "https://leoned.app/subscription/callback";

      const result = await PaymentService.initializeCheckout(schoolId, planId, finalCallbackUrl);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription auto-renewal
   */
  static async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "School ID not found in token claims." });
      }

      const result = await PaymentService.cancelSubscription(schoolId);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Paystack webhook handler
   */
  static async webhook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const paystackSignature = req.headers["x-paystack-signature"] as string;
      const secret = process.env.PAYSTACK_SECRET_KEY;

      // Validate signature if secret key is present in environment
      if (secret && paystackSignature) {
        const hash = crypto
          .createHmac("sha512", secret)
          .update(JSON.stringify(req.body))
          .digest("hex");

        if (hash !== paystackSignature) {
          console.warn("[PaymentController] Signature validation failed.");
          return res.status(401).json({ success: false, message: "Invalid signature" });
        }
      } else if (secret && !paystackSignature) {
        console.warn("[PaymentController] Missing x-paystack-signature header.");
        return res.status(401).json({ success: false, message: "Missing Paystack signature" });
      } else {
        console.warn("[PaymentController] Signature verification skipped (PAYSTACK_SECRET_KEY not set).");
      }

      const { event, data } = req.body;
      if (!event || !data) {
        return res.status(400).json({ success: false, message: "Invalid payload body." });
      }

      // Process webhook asynchronously
      PaymentService.handleWebhook(event, data).catch((err) => {
        console.error("[PaymentController] Error processing webhook event:", err);
      });

      // Acknowledge receipt to Paystack immediately with 200 OK
      return res.status(200).json({ success: true, message: "Webhook received" });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SuperAdmin manual upgrade
   */
  static async manualUpgrade(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // school ID
      const { planId, durationMonths } = req.body;

      if (!planId) {
        return res.status(400).json({ success: false, message: "planId is required." });
      }

      const months = durationMonths ? parseInt(durationMonths, 10) : 1;
      if (isNaN(months) || months <= 0) {
        return res.status(400).json({ success: false, message: "durationMonths must be a positive integer." });
      }

      const result = await PaymentService.manualUpgrade(id, planId, months);
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cron endpoint to process expirations and renewals
   */
  static async cron(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Secure cron with simple token check if environment key is defined
      const cronSecret = process.env.CRON_SECRET;
      const clientSecret = req.headers["x-cron-secret"] || req.query.secret;

      if (cronSecret && clientSecret !== cronSecret) {
        return res.status(403).json({ success: false, message: "Forbidden - Invalid cron secret" });
      }

      const result = await PaymentService.runCronCheck();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
