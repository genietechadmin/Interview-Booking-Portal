const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function emailLayout(title, content) {
  return `
  <div style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:30px 16px;">
      <div style="background:#1A1A1A;padding:22px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;">
          Genie Tech Consultants
        </h1>
        <p style="margin:6px 0 0;color:#F2994A;font-size:14px;font-weight:bold;">
          Interview Booking Portal
        </p>
      </div>

      <div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
        <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:22px;">
          ${title}
        </h2>

        ${content}

        <p style="margin-top:28px;color:#6b7280;font-size:13px;line-height:1.6;">
          Regards,<br/>
          <strong>Genie Tech Consultants</strong>
        </p>
      </div>

      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:18px;">
        © Genie Tech Consultants
      </p>
    </div>
  </div>
  `;
}

async function sendOtpEmail(to, otp) {
  const html = emailLayout(
    "OTP Verification",
    `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Please use the following OTP to continue your interview booking process.
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:18px;text-align:center;margin:24px 0;">
      <p style="margin:0;color:#6b7280;font-size:13px;">Your OTP</p>
      <p style="margin:8px 0 0;color:#F2994A;font-size:32px;font-weight:bold;letter-spacing:6px;">
        ${otp}
      </p>
    </div>

    <p style="color:#6b7280;font-size:13px;">
      This OTP is valid for 5 minutes. Please do not share it with anyone.
    </p>
    `
  );

  await transporter.sendMail({
    from: `"Genie Tech Consultants" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP - Genie Interview Booking",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html,
  });
}

async function sendBookingConfirmation(to, data) {
  const html = emailLayout(
    "Interview Slot Confirmed",
    `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Hello <strong>${data.candidateName}</strong>,
      your interview slot has been booked successfully.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Candidate ID</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.candidateId}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Company</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.companyName}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">HR Number</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.hrNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Date</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.date}</td>
      </tr>
      <tr>
        <td style="padding:12px;color:#6b7280;">Time</td>
        <td style="padding:12px;font-weight:bold;color:#111827;">${data.startTime} - ${data.endTime}</td>
      </tr>
    </table>

    <div style="margin-top:24px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px;color:#166534;font-size:14px;">
      Your slot is confirmed. Please be available at the scheduled time.
    </div>
    `
  );

  await transporter.sendMail({
    from: `"Genie Tech Consultants" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Interview Slot Confirmed - Genie Tech Consultants",
    text: `Your interview has been booked on ${data.date}, ${data.startTime} - ${data.endTime}.`,
    html,
  });
}

async function sendRescheduleConfirmation(to, data) {
  const html = emailLayout(
    "Interview Slot Rescheduled",
    `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Hello <strong>${data.candidateName}</strong>,
      your interview slot has been rescheduled successfully.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Candidate ID</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.candidateId}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">New Date</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.date}</td>
      </tr>
      <tr>
        <td style="padding:12px;color:#6b7280;">New Time</td>
        <td style="padding:12px;font-weight:bold;color:#111827;">${data.startTime} - ${data.endTime}</td>
      </tr>
    </table>
    `
  );

  await transporter.sendMail({
    from: `"Genie Tech Consultants" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Interview Slot Rescheduled - Genie Tech Consultants",
    text: `Your interview has been rescheduled to ${data.date}, ${data.startTime} - ${data.endTime}.`,
    html,
  });
}

async function sendCancelConfirmation(to, data) {
  const html = emailLayout(
    "Interview Slot Cancelled",
    `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Hello <strong>${data.candidateName}</strong>,
      your interview slot has been cancelled successfully.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Candidate ID</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.candidateId}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Company</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.companyName}</td>
      </tr>
      <tr>
        <td style="padding:12px;color:#6b7280;">Status</td>
        <td style="padding:12px;font-weight:bold;color:#dc2626;">Cancelled</td>
      </tr>
    </table>
    `
  );

  await transporter.sendMail({
    from: `"Genie Tech Consultants" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Interview Slot Cancelled - Genie Tech Consultants",
    text: `Your interview booking has been cancelled.`,
    html,
  });
}
async function sendTrainerAssignedEmail(to, data) {
  const title = data.isTrainerChanged
    ? "Trainer Changed"
    : "Trainer Assigned";

  const message = data.isTrainerChanged
    ? "your assigned trainer has been changed for your interview preparation."
    : "a trainer has been assigned for your interview preparation.";

  const subject = data.isTrainerChanged
    ? "Trainer Changed - Genie Tech Consultants"
    : "Trainer Assigned - Genie Tech Consultants";

  const html = emailLayout(
    title,
    `
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Hello <strong>${data.candidateName}</strong>,
      ${message}
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:18px;margin:24px 0;">
      <p style="margin:0;color:#6b7280;font-size:13px;">Trainer Name</p>
      <p style="margin:8px 0 0;color:#F2994A;font-size:24px;font-weight:bold;">
        ${data.trainerName}
      </p>

      <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Trainer Number</p>
      <p style="margin:8px 0 0;color:#111827;font-size:18px;font-weight:bold;">
        ${data.trainerNumber || "-"}
      </p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Candidate ID</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.candidateId}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Company</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.companyName}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Round</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.round}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Date</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#111827;">${data.date}</td>
      </tr>
      <tr>
        <td style="padding:12px;color:#6b7280;">Time</td>
        <td style="padding:12px;font-weight:bold;color:#111827;">${data.startTime} - ${data.endTime}</td>
      </tr>
    </table>

    <div style="margin-top:24px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px;color:#166534;font-size:14px;">
      Please coordinate with your assigned trainer for preparation guidance.
    </div>
    `
  );

  await transporter.sendMail({
    from: `"Genie Tech Consultants" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `${title}: ${data.trainerName} (${data.trainerNumber || "-"})`,
    html,
  });
}
module.exports = {
  sendOtpEmail,
  sendBookingConfirmation,
  sendRescheduleConfirmation,
  sendCancelConfirmation,
  sendTrainerAssignedEmail,
};