import dotenv from "dotenv";

dotenv.config();

const PAYSTACK_API_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

class PaystackClient {
  private getHeaders() {
    return {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Create a plan on Paystack
   * @param name Name of the plan
   * @param amount Amount in NGN (will be converted to kobo)
   * @returns The created plan details
   */
  async createPlan(name: string, amount: number) {
    if (!PAYSTACK_SECRET_KEY) {
      console.warn("[PaystackClient] PAYSTACK_SECRET_KEY is not configured. Simulating plan creation.");
      return {
        success: true,
        data: {
          plan_code: `PLN_simulated_${Math.random().toString(36).substring(7)}`,
        },
      };
    }

    try {
      const response = await fetch(`${PAYSTACK_API_URL}/plan`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name,
          amount: Math.round(amount * 100), // convert to kobo
          interval: "monthly",
          currency: "NGN",
        }),
      });

      const result = (await response.json()) as any;
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Failed to create plan on Paystack");
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error("[PaystackClient] Create plan error:", error);
      throw error;
    }
  }

  /**
   * Update a plan name on Paystack
   * Note: Paystack does not allow changing the price of a plan once created.
   * @param planCode Paystack plan code
   * @param name New name of the plan
   */
  async updatePlan(planCode: string, name: string) {
    if (!PAYSTACK_SECRET_KEY || planCode.startsWith("PLN_simulated_")) {
      console.warn("[PaystackClient] PAYSTACK_SECRET_KEY is not configured. Simulating plan update.");
      return { success: true };
    }

    try {
      const response = await fetch(`${PAYSTACK_API_URL}/plan/${planCode}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ name }),
      });

      const result = (await response.json()) as any;
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Failed to update plan on Paystack");
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error("[PaystackClient] Update plan error:", error);
      throw error;
    }
  }

  /**
   * Initialize a transaction on Paystack
   * @param email Customer email
   * @param amount Amount in NGN
   * @param planCode Paystack plan code to subscribe to
   * @param callbackUrl Redirect URL after payment
   * @param metadata Custom metadata
   */
  async initializeTransaction(
    email: string,
    amount: number,
    planCode: string,
    callbackUrl: string,
    metadata: any
  ) {
    if (!PAYSTACK_SECRET_KEY) {
      console.warn("[PaystackClient] PAYSTACK_SECRET_KEY is not configured. Simulating transaction initialization.");
      const reference = `REF_simulated_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        data: {
          authorization_url: `https://checkout.paystack.com/mock-checkout?reference=${reference}&plan=${planCode}&email=${email}`,
          reference,
        },
      };
    }

    try {
      const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          plan: planCode,
          callback_url: callbackUrl,
          metadata,
        }),
      });

      const result = (await response.json()) as any;
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Failed to initialize Paystack transaction");
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error("[PaystackClient] Initialize transaction error:", error);
      throw error;
    }
  }

  /**
   * Disable a subscription on Paystack (Cancel subscription)
   * @param subscriptionCode Paystack subscription code
   * @param emailToken Paystack email token
   */
  async disableSubscription(subscriptionCode: string, emailToken: string) {
    if (!PAYSTACK_SECRET_KEY || subscriptionCode.startsWith("SUB_simulated_")) {
      console.warn("[PaystackClient] PAYSTACK_SECRET_KEY is not configured. Simulating subscription cancellation.");
      return { success: true };
    }

    try {
      const response = await fetch(`${PAYSTACK_API_URL}/subscription/disable`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          code: subscriptionCode,
          token: emailToken,
        }),
      });

      const result = (await response.json()) as any;
      if (!response.ok || !result.status) {
        throw new Error(result.message || "Failed to disable subscription on Paystack");
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error("[PaystackClient] Disable subscription error:", error);
      throw error;
    }
  }
}

export const paystack = new PaystackClient();
