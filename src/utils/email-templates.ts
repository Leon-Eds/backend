/**
 * Utility to wrap body content in a premium, responsive HTML shell.
 */
function wrapInShell(title: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #334155;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #1e3a8a;
          background-image: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 16px;
          font-size: 16px;
        }
        .content strong {
          color: #0f172a;
        }
        .card {
          background-color: #f1f5f9;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .card table {
          width: 100%;
          border-collapse: collapse;
        }
        .card td {
          padding: 8px 0;
          font-size: 15px;
          vertical-align: top;
        }
        .card td.label {
          font-weight: 600;
          color: #475569;
          width: 140px;
        }
        .card td.value {
          color: #0f172a;
        }
        .btn {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          font-weight: 600;
          border-radius: 6px;
          margin: 16px 0;
          text-align: center;
          font-size: 16px;
          box-shadow: 0 2px 4px rgb(37 99 235 / 0.2);
        }
        .btn:hover {
          background-color: #1d4ed8;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
          color: #64748b;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LeonEd Africa</h1>
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          <p>This is an automated message from LeonEd Africa.</p>
          <p>&copy; ${new Date().getFullYear()} LeonEd Africa. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const emailTemplates = {
  /**
   * 1. School Registration Welcome Email
   */
  getSchoolWelcome(adminName: string, schoolName: string, slug: string, plan: string): { subject: string; html: string } {
    const subject = `Welcome to LeonEd Africa, ${schoolName}!`;
    const html = wrapInShell(
      subject,
      `
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>Congratulations! Your school, <strong>${schoolName}</strong>, is now registered on LeonEd Africa.</p>
      <p>We are excited to help you streamline your academic management, grade reporting, and student-parent communications.</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">School Name:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Portal Subdomain:</td>
            <td class="value"><strong>${slug}</strong> (leoned.app/${slug})</td>
          </tr>
          <tr>
            <td class="label">Subscription Plan:</td>
            <td class="value">${plan}</td>
          </tr>
        </table>
      </div>

      <p>To get started, log in to your admin dashboard and configure your classes, subjects, academic sessions, and invite your faculty.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Access Your Dashboard</a>
      </div>
      
      <p>If you have any questions or need help setting up your portal, reply to this email or contact our support team.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 2. Password Reset Request Email
   */
  getPasswordReset(name: string, resetToken: string): { subject: string; html: string } {
    const subject = "Reset Your LeonEd Africa Password";
    const resetUrl = `https://leoned.app/reset-password?token=${resetToken}`;
    const html = wrapInShell(
      subject,
      `
      <p>Hello <strong>${name}</strong>,</p>
      <p>You are receiving this email because we received a password reset request for your account.</p>
      <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #475569;">${resetUrl}</p>
      
      <p>If you did not request a password reset, no further action is required; you can safely ignore this email.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 3. Teacher Welcome/Credentials Email
   */
  getTeacherWelcome(name: string, schoolName: string, systemEmail: string, passwordTemp: string): { subject: string; html: string } {
    const subject = `Welcome to LeonEd Africa — Invitation from ${schoolName}`;
    const html = wrapInShell(
      subject,
      `
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been added as a faculty member at <strong>${schoolName}</strong> on LeonEd Africa.</p>
      <p>Your portal account has been created successfully. Use the credentials below to log in:</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">Portal/School:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="value"><strong>${systemEmail}</strong></td>
          </tr>
          <tr>
            <td class="label">Temporary Password:</td>
            <td class="value"><code>${passwordTemp}</code></td>
          </tr>
        </table>
      </div>

      <p>For security, please change your password as soon as you log in by navigating to your account settings.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Log In to Portal</a>
      </div>
      `
    );
    return { subject, html };
  },

  /**
   * 4. Student/Parent Onboarding Email
   */
  getStudentWelcome(
    parentEmail: string,
    parentName: string,
    studentName: string,
    schoolName: string,
    systemEmail: string,
    admissionNumber: string,
    passwordTemp: string
  ): { subject: string; html: string } {
    const subject = `Student Account Onboarding — ${schoolName}`;
    const html = wrapInShell(
      subject,
      `
      <p>Dear <strong>${parentName || "Parent/Guardian"}</strong>,</p>
      <p>We are pleased to inform you that <strong>${studentName}</strong> has been registered at <strong>${schoolName}</strong> on the LeonEd Africa portal.</p>
      <p>Through this portal, you can view report cards, track attendance, and monitor fee status.</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">Student Name:</td>
            <td class="value">${studentName}</td>
          </tr>
          <tr>
            <td class="label">Admission Number:</td>
            <td class="value"><strong>${admissionNumber}</strong></td>
          </tr>
          <tr>
            <td class="label">Student Login ID:</td>
            <td class="value"><strong>${systemEmail}</strong></td>
          </tr>
          <tr>
            <td class="label">Temporary Password:</td>
            <td class="value"><code>${passwordTemp}</code></td>
          </tr>
        </table>
      </div>

      <p>Please log in using the Student Login ID and password to access the portal.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Access Student Portal</a>
      </div>
      `
    );
    return { subject, html };
  },

  /**
   * 5. Class Created Notification Email
   */
  getClassCreated(schoolName: string, className: string, arm: string): { subject: string; html: string } {
    const subject = `New Class Added: ${className} ${arm}`.trim();
    const html = wrapInShell(
      subject,
      `
      <p>Hello,</p>
      <p>This is to confirm that a new class has been created successfully in the <strong>${schoolName}</strong> portal.</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">Class Name:</td>
            <td class="value">${className}</td>
          </tr>
          <tr>
            <td class="label">Class Arm/Section:</td>
            <td class="value">${arm || "None"}</td>
          </tr>
          <tr>
            <td class="label">Created At:</td>
            <td class="value">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <p>You can now assign subjects and enroll students to this class in your dashboard.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 6. Session Created Notification Email
   */
  getSessionCreated(schoolName: string, sessionName: string, startDate: Date, endDate: Date): { subject: string; html: string } {
    const subject = `New Academic Session Created: ${sessionName}`;
    const html = wrapInShell(
      subject,
      `
      <p>Hello,</p>
      <p>This is to confirm that a new academic session has been created successfully in the <strong>${schoolName}</strong> portal.</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">Session Name:</td>
            <td class="value"><strong>${sessionName}</strong></td>
          </tr>
          <tr>
            <td class="label">Start Date:</td>
            <td class="value">${new Date(startDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td class="label">End Date:</td>
            <td class="value">${new Date(endDate).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <p>You can set this session as the active/current session inside your term management settings.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 7. Super Admin Welcome Email
   */
  getSuperAdminWelcome(name: string, email: string): { subject: string; html: string } {
    const subject = "LeonEd Africa — Super Admin Account Created";
    const html = wrapInShell(
      subject,
      `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your Super Admin account has been successfully initialized on LeonEd Africa.</p>
      <p>As a Super Admin, you have full administrative privileges to monitor platform metrics, manage schools, subscriptions, and system configurations.</p>
      
      <div class="card">
        <table>
          <tr>
            <td class="label">Role:</td>
            <td class="value"><strong>Super Admin</strong></td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="value"><strong>${email}</strong></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Access Admin Console</a>
      </div>
      
      <p>Please ensure your account credentials are kept secure at all times.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 8. OTP Verification Email
   */
  getVerificationOtp(name: string, otp: string): { subject: string; html: string } {
    const subject = "LeonEd Africa — Email Verification OTP";
    const html = wrapInShell(
      subject,
      `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for signing up with LeonEd Africa. To complete your registration and verify your email address, please use the following One-Time Password (OTP):</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e3a8a; background: #f1f5f9; padding: 12px 36px; border-radius: 8px; border: 1px solid #cbd5e1;">
          ${otp}
        </div>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px;">This OTP is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
      
      <p>If you did not initiate this request, please ignore this email or contact support if you have concerns.</p>
      `
    );
    return { subject, html };
  }
};

