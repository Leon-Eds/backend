import { requireEnvironmentVariable } from "../config/env";
import { ContactQuery } from "../validations/contact.validation";
import { emailService } from "../utils/email";
import { successResponse } from "../utils/response";

export class ContactService {
  static async submit(query: ContactQuery) {
    const response = successResponse(true, "Your demo request has been received. We will get back to you soon.");

    // Silently accept honeypot submissions so bots cannot adapt to the filter.
    if (query.website) return response;

    const contactEmail = requireEnvironmentVariable("CONTACT_EMAIL");
    await emailService.sendContactQueryEmail(contactEmail, query);
    return response;
  }
}
