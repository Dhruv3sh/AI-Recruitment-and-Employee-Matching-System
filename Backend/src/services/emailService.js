import nodemailer from "nodemailer";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function mailConfiguration() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const from = process.env.SMTP_FROM;
  if (!host || !from) {
    const error = new Error(
      "Email is not configured. Set SMTP_HOST and SMTP_FROM before accepting applications.",
    );
    error.status = 503;
    throw error;
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (Boolean(user) !== Boolean(pass)) {
    const error = new Error(
      "Set both SMTP_USER and SMTP_PASS, or neither for a local SMTP server.",
    );
    error.status = 503;
    throw error;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  if (port === 587 && secure) {
    const error = new Error(
      "SMTP_SECURE must be false when SMTP_PORT is 587. Port 587 uses STARTTLS; use SMTP_SECURE=true only with implicit-TLS port 465.",
    );
    error.status = 503;
    throw error;
  }

  return {
    from,
    transport: {
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    },
  };
}

export async function sendApplicationAcceptedEmail({
  candidateName,
  candidateEmail,
  job,
}) {
  const { from, transport } = mailConfiguration();

  const company = job.company || "The hiring team";
  const role = job.title || "the role";
  const location = job.location ? ` in ${job.location}` : "";
  const username = candidateName || "Candidate";

  const safeName = escapeHtml(username);
  const safeCompany = escapeHtml(company);
  const safeRole = escapeHtml(role);
  const safeLocation = escapeHtml(location);

  const year = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Congratulations on Your Selection - Matchwise</title>
    </head>

    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0"
        role="presentation"
        style="background-color:#f4f6f8;padding:20px;">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
              role="presentation"
              style="width:100%;max-width:600px;background-color:#ffffff;
              border-radius:8px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color:#172554;padding:35px 20px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:30px;">
                    Matchwise
                  </h1>
                  <p style="color:#cbd5e1;margin:10px 0 0;font-size:15px;">
                    Connecting Talent with Opportunity
                  </p>
                </td>
              </tr>

              <!-- Congratulations -->
              <tr>
                <td style="padding:35px 30px 10px;text-align:center;">
                  <h2 style="color:#172554;margin:0;font-size:26px;">
                    Congratulations, ${safeName}!
                  </h2>

                  <p style="color:#16a34a;font-size:16px;font-weight:bold;margin:15px 0 0;">
                    Your Application Has Been Accepted
                  </p>
                </td>
              </tr>

              <!-- Email Content -->
              <tr>
                <td style="padding:25px 30px 35px;">

                  <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                    Hi ${safeName},
                  </p>

                  <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                    We are pleased to inform you that
                    <strong style="color:#172554;">${safeCompany}</strong>
                    has accepted your application for the
                    <strong style="color:#172554;">${safeRole}</strong>${safeLocation}.
                  </p>

                  <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 25px;">
                    Congratulations on reaching this stage of the recruitment
                    process! We appreciate your interest in this opportunity
                    and look forward to helping you move ahead.
                  </p>

                  <!-- Next Steps -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    role="presentation"
                    style="background-color:#eff6ff;border-left:4px solid #2563eb;
                    border-radius:5px;">
                    <tr>
                      <td style="padding:22px 20px;">

                        <h3 style="color:#1e3a8a;margin:0 0 12px;font-size:18px;">
                          What Happens Next?
                        </h3>

                        <p style="color:#334155;font-size:15px;line-height:1.7;margin:0;">
                          The hiring team will review your submitted profile
                          and resume and contact you at this email address
                          with further instructions, including any interview,
                          assessment, or documentation details, if applicable.
                        </p>

                      </td>
                    </tr>
                  </table>

                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:25px 0 0;">
                    <strong>Please wait for further updates.</strong>
                    Keep an eye on your registered email address for
                    communication from the hiring team. No further action
                    is required from you at this moment unless instructed.
                  </p>

                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:25px 0 0;">
                    Please note that application acceptance confirms your
                    progress in the recruitment process and does not
                    constitute a formal job offer.
                  </p>

                  <p style="color:#475569;font-size:16px;line-height:1.7;margin:30px 0 0;">
                    Once again, congratulations! We wish you the very best
                    for the next stage of your journey.
                  </p>

                  <p style="color:#172554;font-size:15px;line-height:1.7;margin:25px 0 0;">
                    Best regards,<br>
                    <strong>Team Matchwise</strong><br>
                    <span style="color:#64748b;">
                      Connecting talent with the right opportunities.
                    </span>
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#1f2937;padding:22px 30px;text-align:center;">
                  <p style="margin:0 0 8px;color:#e2e8f0;font-size:12px;line-height:1.5;">This is an automated application update. Please do not reply directly to this email.</p>
                  <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} Matchwise. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hi ${username},

Congratulations! ${company} has accepted your application for ${role}${location}.

What happens next?
The hiring team will review your submitted profile and resume, then contact you at this email address with further instructions regarding interviews, assessments, or documentation, if applicable.

Please wait for further updates and keep an eye on your registered email address. No further action is required at this moment unless instructed.

Please note that application acceptance does not constitute a formal job offer.

Best regards,
Team Matchwise
Connecting talent with the right opportunities.

© ${year} Matchwise. All rights reserved.`;

  await nodemailer.createTransport(transport).sendMail({
    from,
    to: candidateEmail,
    subject: `Congratulations! Your Application Has Been Accepted — ${role}`,
    text,
    html,
  });
}

export async function sendApplicationRejectedEmail({
  candidateName,
  candidateEmail,
  job,
}) {
  const { from, transport } = mailConfiguration();
  const company = job.company || "The hiring team";
  const role = job.title || "the role";
  const location = job.location ? ` in ${job.location}` : "";
  const username = candidateName || "Candidate";
  const safeName = escapeHtml(username);
  const safeCompany = escapeHtml(company);
  const safeRole = escapeHtml(role);
  const safeLocation = escapeHtml(location);
  const year = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Update - Matchwise</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f6f8;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;overflow:hidden;">
                <tr>
                  <td style="background-color:#e0f2fe;padding:22px 30px;">
                    <p style="margin:0;color:#1e3a5f;font-size:12px;letter-spacing:.4px;">APPLICATION UPDATE</p>
                    <h1 style="margin:7px 0 0;color:#102a43;font-size:25px;line-height:1.2;">${safeCompany}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 36px 12px;">
                    <p style="margin:0 0 26px;color:#52616b;font-size:13px;">Role: ${safeRole}${safeLocation}</p>
                    <p style="margin:0 0 20px;color:#334e68;font-size:16px;line-height:1.7;">Dear ${safeName},</p>
                    <p style="margin:0 0 20px;color:#334e68;font-size:16px;line-height:1.7;">Thank you for the time and care you invested in applying for the <strong>${safeRole}</strong> position at <strong>${safeCompany}</strong>.</p>
                    <p style="margin:0 0 20px;color:#334e68;font-size:16px;line-height:1.7;">After careful consideration, we have decided not to move forward with your application for this role. This decision reflects the current requirements of the position and the needs of the team.</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-left:4px solid #94a3b8;">
                      <tr>
                        <td style="padding:18px 20px;color:#475569;font-size:15px;line-height:1.65;">We appreciate your interest in ${safeCompany}. New roles can open as teams and requirements change, and we encourage you to consider future opportunities that match your experience.</td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;color:#334e68;font-size:16px;line-height:1.7;">We wish you every success in your job search and professional journey.</p>
                    <p style="margin:28px 0 0;color:#334e68;font-size:15px;line-height:1.65;">Sincerely,<br><strong>${safeCompany} Recruitment Team</strong><br><span style="color:#64748b;">via Matchwise</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#1f2937;padding:22px 30px;text-align:center;">
                    <p style="margin:0 0 8px;color:#e2e8f0;font-size:12px;line-height:1.5;">This is an automated application update. Please do not reply directly to this email.</p>
                    <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${year} Matchwise. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `Dear ${username},

Thank you for the time and care you invested in applying for the ${role} position at ${company}.

After careful consideration, we have decided not to move forward with your application for this role. This decision reflects the current requirements of the position and the needs of the team.

We appreciate your interest in ${company}. New roles can open as teams and requirements change, and we encourage you to consider future opportunities that match your experience.

We wish you every success in your job search and professional journey.

Sincerely,
${company} Recruitment Team
via Matchwise`;

  await nodemailer.createTransport(transport).sendMail({
    from,
    to: candidateEmail,
    subject: `Application update for ${role} at ${company}`,
    text,
    html,
  });
}
