import nodemailer from "nodemailer";

export function getTransport() {
  const enabled = (process.env.MAIL_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) {
    return {
      sendMail: async (opts) => {
        console.log("[MAIL_DISABLED] Would send:", opts);
        return { messageId: "disabled" };
      }
    };
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export async function sendTicketEmail({ to, subject, html }) {
  if (!to) {
    console.error("[EMAIL ERROR] No recipient defined", { to, subject });
    return;
  }

  const from = process.env.SMTP_FROM || "Bug Tracker <noreply@bugtracker.local>";
  const transport = getTransport();
  return transport.sendMail({ from, to, subject, html });
}



export function ticketEmailTemplate({ title, projectKey, action, details }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif">
      <h3>[${projectKey}] ${action}: ${title}</h3>
      <div>${details || ""}</div>
      <hr/>
      <small>This is an automated message from Bug Tracker.</small>
    </div>
  `;
}
