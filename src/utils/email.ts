import { Resend } from "resend";
import { emailTemplates } from "./email-templates";

let resend: Resend | null = null;

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.FROM_EMAIL?.trim();

  if (!apiKey || apiKey === "re_dev_placeholderkey") {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!fromEmail) {
    throw new Error("FROM_EMAIL is not configured. Use an address on your verified Resend domain.");
  }

  if (!resend) {
    resend = new Resend(apiKey);
  }

  return { resend, fromEmail };
}

async function sendMail(to: string, subject: string, html: string) {
  const client = getEmailClient();

  try {
    const response = await client.resend.emails.send({
      from: client.fromEmail,
      to,
      subject,
      html,
    });
    if (response.error) {
      throw new Error(response.error.message || JSON.stringify(response.error));
    }
    console.log(`[Email Service] Email sent successfully. Message ID: ${response.data?.id || "unknown"}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`[Email Service] Failed to send email via Resend API:`, error);
    throw error;
  }
}

export const emailService = {
  /**
   * Send Welcome Email to School Admin upon Registration
   */
  async sendSchoolWelcomeEmail(to: string, adminName: string, schoolName: string, slug: string, plan: string) {
    const { subject, html } = emailTemplates.getSchoolWelcome(adminName, schoolName, slug, plan);
    return sendMail(to, subject, html);
  },

  /**
   * Send Password Reset Email with Token/Link
   */
  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const { subject, html } = emailTemplates.getPasswordReset(name, token);
    return sendMail(to, subject, html);
  },

  /**
   * Send Teacher Invitation and Temporary Credentials
   */
  async sendTeacherWelcomeEmail(to: string, name: string, schoolName: string, systemEmail: string, passwordTemp: string) {
    const { subject, html } = emailTemplates.getTeacherWelcome(name, schoolName, systemEmail, passwordTemp);
    return sendMail(to, subject, html);
  },

  /**
   * Send Bursar Invitation and Temporary Credentials
   */
  async sendBursarWelcomeEmail(to: string, name: string, schoolName: string, systemEmail: string, passwordTemp: string) {
    const { subject, html } = emailTemplates.getBursarWelcome(name, schoolName, systemEmail, passwordTemp);
    return sendMail(to, subject, html);
  },

  /**
   * Send Student/Parent Invitation and Credentials
   */
  async sendStudentWelcomeEmail(
    to: string,
    parentName: string,
    studentName: string,
    schoolName: string,
    systemEmail: string,
    admissionNumber: string,
    passwordTemp: string
  ) {
    const { subject, html } = emailTemplates.getStudentWelcome(to, parentName, studentName, schoolName, systemEmail, admissionNumber, passwordTemp);
    return sendMail(to, subject, html);
  },

  /**
   * Send Class Creation Notification
   */
  async sendClassCreatedNotification(to: string, schoolName: string, className: string, arm: string) {
    const { subject, html } = emailTemplates.getClassCreated(schoolName, className, arm);
    return sendMail(to, subject, html);
  },

  /**
   * Send Session Creation Notification
   */
  async sendSessionCreatedNotification(to: string, schoolName: string, sessionName: string, startDate: Date, endDate: Date) {
    const { subject, html } = emailTemplates.getSessionCreated(schoolName, sessionName, startDate, endDate);
    return sendMail(to, subject, html);
  },

  /**
   * Send Welcome Email to Super Admin upon creation
   */
  async sendSuperAdminWelcomeEmail(to: string, name: string) {
    const { subject, html } = emailTemplates.getSuperAdminWelcome(name, to);
    return sendMail(to, subject, html);
  },

  /**
   * Send OTP Verification Email
   */
  async sendVerificationOtpEmail(to: string, name: string, otp: string) {
    const { subject, html } = emailTemplates.getVerificationOtp(name, otp);
    return sendMail(to, subject, html);
  },

  /**
   * Send Subscription Welcome/Active Email
   */
  async sendSubscriptionWelcomeEmail(
    to: string,
    adminName: string,
    schoolName: string,
    planName: string,
    amount: string,
    maxTeachers: number,
    maxStudents: number,
    endedAt: Date | null
  ) {
    const { subject, html } = emailTemplates.getSubscriptionWelcome(adminName, schoolName, planName, amount, maxTeachers, maxStudents, endedAt);
    return sendMail(to, subject, html);
  },

  /**
   * Send Subscription Renewal Reminder Email
   */
  async sendSubscriptionRenewalReminderEmail(
    to: string,
    adminName: string,
    schoolName: string,
    planName: string,
    endedAt: Date,
    amount: string
  ) {
    const { subject, html } = emailTemplates.getSubscriptionRenewalReminder(adminName, schoolName, planName, endedAt, amount);
    return sendMail(to, subject, html);
  },

  /**
   * Send Subscription Downgrade Email
   */
  async sendSubscriptionDowngradedEmail(
    to: string,
    adminName: string,
    schoolName: string,
    planName: string,
    maxTeachers: number,
    maxStudents: number
  ) {
    const { subject, html } = emailTemplates.getSubscriptionDowngradedNotification(adminName, schoolName, planName, maxTeachers, maxStudents);
    return sendMail(to, subject, html);
  }
};
