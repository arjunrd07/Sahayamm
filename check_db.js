const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = '';
let supabaseKey = '';
let resendKey = '';

try {
  const env = fs.readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
    if (line.startsWith('RESEND_API_KEY=')) {
      resendKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error("Error reading env file", e);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const notificationCopy = {
  loan_requested: (p) => ({
    title: "New loan request",
    message: `${p.customerName} requested ${p.amount} for "${p.purpose}".`,
  }),
};

async function sendEmail(input) {
  const html = `<div>${input.subject}: ${input.body}</div>`;

  if (!resendKey) {
    console.log(`[mock-email] to=${input.to} subject="${input.subject}"\n${input.body}`);
    return { sent: true, mock: true };
  }

  console.log("Fetching resend endpoint...");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Sahayam <notifications@yourdomain.com>",
      to: [input.to],
      subject: input.subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error(`Resend send failed: ${res.status} ${await res.text()}`);
    return { sent: false, mock: false };
  }

  const data = await res.json();
  return { sent: true, mock: false, id: data?.id };
}

async function test() {
  const input = {
    orgId: 'dc255971-ef63-40ef-bffc-71dc3230643a',
    userId: '7be7daf4-efdc-4f35-ae4d-8ffc93e61c89',
    userEmail: 'demo-borrower@gmail.com',
    loanId: null,
    type: 'loan_requested',
    params: { customerName: 'Demo- Borrower', amount: '₹5,000', purpose: 'Testing' }
  };

  const { title, message } = notificationCopy[input.type](input.params);

  console.log("Inserting notification...");
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      loan_id: input.loanId ?? null,
      title,
      message,
      type: input.type,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to write notification:", error.message);
  } else {
    console.log("Notification inserted successfully:", notification);
  }

  try {
    console.log("Sending email...");
    const emailResult = await sendEmail({
      to: input.userEmail,
      type: input.type,
      subject: title,
      body: message,
    });
    console.log("Email result:", emailResult);
  } catch (emailErr) {
    console.error("Email send threw error:", emailErr);
  }
}

test();
