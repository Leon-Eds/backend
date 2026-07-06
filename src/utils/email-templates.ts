/**
 * Utility to wrap body content in a premium, responsive HTML shell.
 */
function wrapInShell(title: string, headerTitle: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f3f4f6;
          color: #374151;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .outer-container {
          width: 100%;
          background-color: #f3f4f6;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e5e7eb;
          padding: 24px;
        }
        .header {
          background: linear-gradient(135deg, #013a25 0%, #004b30 100%);
          padding: 42px 24px;
          text-align: center;
          border-radius: 12px;
        }
        .header h1 {
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .header p {
          color: #34d399;
          font-size: 14px;
          margin: 8px 0 0;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .content {
          padding: 32px 8px 16px;
          line-height: 1.6;
        }
        .content h2 {
          color: #004b30;
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 16px;
        }
        .content p {
          margin: 0 0 16px;
          font-size: 15px;
          color: #4b5563;
        }
        .content strong {
          color: #111827;
        }
        .alert-box {
          background-color: #ecfdf5;
          border-left: 4px solid #004b30;
          border-radius: 4px;
          padding: 16px;
          margin: 24px 0;
          color: #013a25;
          font-weight: 500;
          font-size: 15px;
        }
        .alert-box-warning {
          background-color: #fffbeb;
          border-left: 4px solid #d97706;
          border-radius: 4px;
          padding: 16px;
          margin: 24px 0;
          color: #78350f;
          font-weight: 500;
          font-size: 15px;
        }
        .card {
          background-color: #f9fafb;
          border-radius: 10px;
          padding: 20px;
          margin: 24px 0;
          border: 1px solid #f3f4f6;
        }
        .card table {
          width: 100%;
          border-collapse: collapse;
        }
        .card td {
          padding: 10px 0;
          font-size: 15px;
          vertical-align: top;
          border-bottom: 1px solid #f3f4f6;
        }
        .card tr:last-child td {
          border-bottom: none;
        }
        .card td.label {
          font-weight: 600;
          color: #6b7280;
          width: 150px;
        }
        .card td.value {
          color: #111827;
          font-weight: 500;
        }
        .btn {
          display: inline-block;
          background-color: #004b30;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          font-weight: 600;
          border-radius: 8px;
          margin: 24px 0;
          text-align: center;
          font-size: 15px;
          box-shadow: 0 4px 6px -1px rgba(0, 75, 48, 0.25);
        }
        .btn:hover {
          background-color: #013a25;
        }
        .btn-orange {
          display: inline-block;
          background-color: #b45309;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          font-weight: 600;
          border-radius: 8px;
          margin: 24px 0;
          text-align: center;
          font-size: 15px;
          box-shadow: 0 4px 6px -1px rgba(180, 83, 9, 0.25);
        }
        .btn-orange:hover {
          background-color: #78350f;
        }
        .footer {
          text-align: center;
          padding: 24px 8px 8px;
          font-size: 13px;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          margin-top: 32px;
        }
        .footer a {
          color: #004b30;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="outer-container">
        <div class="container">
          <div class="header">
            <h1>${headerTitle}</h1>
            <p>LeonEd Africa</p>
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <p>This is an automated message from LeonEd Africa.</p>
            <p>&copy; ${new Date().getFullYear()} <a href="https://leoned.app">LeonEd Africa</a>. All rights reserved.</p>
          </div>
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
      `Welcome to LeonEd Africa! 🎓`,
      `
      <h2>School Registration Successful</h2>
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>Congratulations! Your school is now registered on LeonEd Africa. We are excited to support your academic management journey.</p>
      
      <div class="alert-box">
        ✓ Your school administration portal and subdomain are configured and active!
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">School Name:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Portal Link:</td>
            <td class="value"><a href="https://${slug}.leoned.app" style="color: #004b30; font-weight: 600; text-decoration: none;">${slug}.leoned.app</a></td>
          </tr>
          <tr>
            <td class="label">Subscription Plan:</td>
            <td class="value">${plan}</td>
          </tr>
        </table>
      </div>

      <p>To get started, log in to your admin dashboard to set up your academic sessions, register classes and subjects, and invite your teachers.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Access Your Dashboard</a>
      </div>
      
      <p>If you need any assistance setting up your portal, feel free to reply to this email.</p>
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
      `Password Reset Request 🔑`,
      `
      <h2>Reset Your Password</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset the password associated with your LeonEd Africa account.</p>
      
      <div class="alert-box-warning">
        ⚠ This password reset link will expire in <strong>1 hour</strong>.
      </div>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn-orange" target="_blank">Reset Password</a>
      </div>

      <p>If the button doesn't work, copy and paste the URL below into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #f3f4f6;">${resetUrl}</p>
      
      <p>If you did not request this change, you can safely ignore this email; your password will remain secure.</p>
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
      `Welcome to the Faculty! 🍎`,
      `
      <h2>Account Credentials Created</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been added as a faculty member at <strong>${schoolName}</strong> on the LeonEd Africa portal.</p>

      <div class="alert-box">
        ✓ Your teacher portal profile is set up. Use the credentials below to log in:
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">School:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="value" style="font-family: monospace; font-size: 15px;"><strong>${systemEmail}</strong></td>
          </tr>
          <tr>
            <td class="label">Password:</td>
            <td class="value" style="font-family: monospace; font-size: 15px; color: #b45309;">${passwordTemp}</td>
          </tr>
        </table>
      </div>

      <p>For security reasons, we strongly recommend changing this temporary password immediately after your first login.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Log In to Portal</a>
      </div>
      `
    );
    return { subject, html };
  },

  /**
   * 3b. Bursar Welcome/Credentials Email
   */
  getBursarWelcome(name: string, schoolName: string, systemEmail: string, passwordTemp: string): { subject: string; html: string } {
    const subject = `Welcome to LeonEd Africa — Invitation from ${schoolName}`;
    const html = wrapInShell(
      subject,
      `Welcome to the Finance Team! 💼`,
      `
      <h2>Bursar Account Credentials Created</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been added as a Bursar at <strong>${schoolName}</strong> on the LeonEd Africa portal.</p>

      <div class="alert-box">
        ✓ Your bursar portal profile is set up. Use the credentials below to log in:
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">School:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="value" style="font-family: monospace; font-size: 15px;"><strong>${systemEmail}</strong></td>
          </tr>
          <tr>
            <td class="label">Password:</td>
            <td class="value" style="font-family: monospace; font-size: 15px; color: #b45309;">${passwordTemp}</td>
          </tr>
        </table>
      </div>

      <p>For security reasons, we strongly recommend changing this temporary password immediately after your first login.</p>
      
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
      `Welcome to the Portal! 📝`,
      `
      <h2>Student Portal Access Details</h2>
      <p>Dear <strong>${parentName || "Parent/Guardian"}</strong>,</p>
      <p>We are pleased to inform you that <strong>${studentName}</strong> is registered at <strong>${schoolName}</strong> on the LeonEd Africa portal.</p>

      <div class="alert-box">
        ✓ You can now monitor grades, check report cards, and track attendance using the portal details below:
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">Student Name:</td>
            <td class="value">${studentName}</td>
          </tr>
          <tr>
            <td class="label">Admission No:</td>
            <td class="value" style="font-family: monospace;"><strong>${admissionNumber}</strong></td>
          </tr>
          <tr>
            <td class="label">Login Email/ID:</td>
            <td class="value" style="font-family: monospace;"><strong>${systemEmail}</strong></td>
          </tr>
          <tr>
            <td class="label">Password:</td>
            <td class="value" style="font-family: monospace; color: #b45309;">${passwordTemp}</td>
          </tr>
        </table>
      </div>

      <p>Please click the link below to access the login dashboard:</p>
      
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
      `New Class Configured 🏫`,
      `
      <h2>Class Setup Completed</h2>
      <p>Hello Admin,</p>
      <p>A new class has been created successfully in the <strong>${schoolName}</strong> portal registry.</p>
      
      <div class="alert-box">
        ✓ Class ${className} ${arm || ""} is now active and ready for enrollment.
      </div>

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

      <p>You can now navigate to your dashboard to assign teachers, attach subjects, or register students to this class.</p>
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
      `New Academic Session 📅`,
      `
      <h2>Session Setup Completed</h2>
      <p>Hello Admin,</p>
      <p>A new academic session has been created successfully in the <strong>${schoolName}</strong> portal registry.</p>
      
      <div class="alert-box">
        ✓ Session <strong>${sessionName}</strong> is now configured.
      </div>

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

      <p>You can mark this session as active within your school configuration panel to direct grading and registration to this term.</p>
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
      `System Authorized 🛡️`,
      `
      <h2>Super Admin Configured</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your Super Admin security profile has been successfully initialized on LeonEd Africa.</p>

      <div class="alert-box">
        ✓ You have full administrative privileges to monitor platform metrics, manage registered schools, and edit billing.
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">Role:</td>
            <td class="value"><strong>Super Admin</strong></td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="value" style="font-family: monospace;"><strong>${email}</strong></td>
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
      `Verify Your Email ✉️`,
      `
      <h2>One-Time Verification Code</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for signing up with LeonEd Africa. To complete your registration and verify your email address, please use the following One-Time Password (OTP):</p>
      
      <div style="text-align: center; margin: 36px 0;">
        <div style="display: inline-block; font-family: monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #004b30; background: #ecfdf5; padding: 14px 42px; border-radius: 10px; border: 2px dashed #34d399; box-shadow: 0 4px 6px -1px rgba(0, 75, 48, 0.05);">
          ${otp}
        </div>
      </div>

      <div class="alert-box-warning" style="text-align: center;">
        ⚠ This verification code is active for <strong>15 minutes</strong>. Do not share it with others.
      </div>
      
      <p>If you did not initiate this registration request, please disregard this automated notification.</p>
      `
    );
    return { subject, html };
  },

  /**
   * 9. Subscription Active/Welcome Email
   */
  getSubscriptionWelcome(
    adminName: string,
    schoolName: string,
    planName: string,
    amount: string,
    maxTeachers: number,
    maxStudents: number,
    endedAt: Date | null
  ): { subject: string; html: string } {
    const subject = `Your Subscription is Active: ${planName} Plan`;
    const formattedDate = endedAt ? new Date(endedAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "Indefinite / Manual Upgrade";
    const teachersLimit = maxTeachers >= 999999 ? "Unlimited" : maxTeachers;
    const studentsLimit = maxStudents >= 999999 ? "Unlimited" : maxStudents;

    const html = wrapInShell(
      subject,
      `Subscription Active! 🎉`,
      `
      <h2>Thank You for Subscribing</h2>
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>Your subscription is active for <strong>${schoolName}</strong>. You have been successfully upgraded to the <strong>${planName}</strong> plan.</p>
      
      <div class="alert-box">
        ✓ Your school has access to the full benefits of the ${planName} plan!
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">Plan Name:</td>
            <td class="value">${planName}</td>
          </tr>
          <tr>
            <td class="label">Price:</td>
            <td class="value">₦${amount} / month</td>
          </tr>
          <tr>
            <td class="label">Max Teachers:</td>
            <td class="value">${teachersLimit}</td>
          </tr>
          <tr>
            <td class="label">Max Students:</td>
            <td class="value">${studentsLimit}</td>
          </tr>
          <tr>
            <td class="label">Next Payment Date:</td>
            <td class="value">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <p>Your features are active and available immediately. You can now add and manage your teachers and students up to your new limits.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Access Your Dashboard</a>
      </div>
      `
    );
    return { subject, html };
  },

  /**
   * 10. Subscription Renewal Reminder
   */
  getSubscriptionRenewalReminder(
    adminName: string,
    schoolName: string,
    planName: string,
    endedAt: Date,
    amount: string
  ): { subject: string; html: string } {
    const subject = `LeonEd Africa Subscription Renewal Reminder`;
    const formattedDate = new Date(endedAt).toLocaleDateString("en-US", { dateStyle: "long" });

    const html = wrapInShell(
      subject,
      `Renewal Approaching 📅`,
      `
      <h2>Subscription Renewal Warning</h2>
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>This is a friendly reminder that the subscription plan <strong>${planName}</strong> for <strong>${schoolName}</strong> is close to its renewal deadline on <strong>${formattedDate}</strong>.</p>
      
      <div class="alert-box-warning">
        ⚠ Please ensure your payment card is funded to avoid any service disruptions or automatic downgrades.
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">School:</td>
            <td class="value">${schoolName}</td>
          </tr>
          <tr>
            <td class="label">Plan Name:</td>
            <td class="value">${planName}</td>
          </tr>
          <tr>
            <td class="label">Renewal Price:</td>
            <td class="value">₦${amount}</td>
          </tr>
          <tr>
            <td class="label">Renewal Date:</td>
            <td class="value">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <p>No action is needed if your card details are correct and up to date, as billing is automatic. If you need to update your payment information, please log in to your dashboard.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn" target="_blank">Manage Subscription</a>
      </div>
      `
    );
    return { subject, html };
  },

  /**
   * 11. Subscription Downgraded Notification
   */
  getSubscriptionDowngradedNotification(
    adminName: string,
    schoolName: string,
    planName: string,
    maxTeachers: number,
    maxStudents: number
  ): { subject: string; html: string } {
    const subject = `Your LeonEd Africa Subscription has Expired`;
    const html = wrapInShell(
      subject,
      `Subscription Expired ⚠`,
      `
      <h2>Service Downgraded to Free</h2>
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>We were unable to process your subscription renewal payment for <strong>${schoolName}</strong>. As a result, your plan has been downgraded to the <strong>${planName}</strong> plan.</p>
      
      <div class="alert-box-warning">
        ⚠ Your school accounts exceeding the limits of the Free plan are now temporarily suspended and inaccessible until you resubscribe.
      </div>

      <div class="card">
        <table>
          <tr>
            <td class="label">Current Plan:</td>
            <td class="value">${planName} (Free)</td>
          </tr>
          <tr>
            <td class="label">Max Teachers Allowed:</td>
            <td class="value">${maxTeachers}</td>
          </tr>
          <tr>
            <td class="label">Max Students Allowed:</td>
            <td class="value">${maxStudents}</td>
          </tr>
        </table>
      </div>

      <p>To reactivate all suspended teacher and student accounts, please log in and update your payment details or choose a new paid subscription plan.</p>
      
      <div style="text-align: center;">
        <a href="https://leoned.app/login" class="btn-orange" target="_blank">Renew Subscription Now</a>
      </div>
      `
    );
    return { subject, html };
  }
};

