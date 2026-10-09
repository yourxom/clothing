// Utility script to verify SMS Horizon delivery
// Usage: node scripts/test-sms.cjs [10-digit-phone]
const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length) {
      process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const user = process.env.SMS_USER || "aureliain";
const apiKey = process.env.SMS_API_KEY;
const senderId = process.env.SMS_SENDER_ID || "AURELIA";
const tid = process.env.SMS_DLT_TEMPLATE_ID || "1607100000000323238";
const phone = process.argv[2] || "7878458471";
const otp = Math.floor(100000 + Math.random() * 900000).toString();

const message = `OTP for your new user account registration is: ${otp}\n\n-Aurelia`;

console.log("=== Testing SMS Horizon OTP Delivery ===");
console.log("Endpoint: https://smshorizon.com/api/v2/sendsms");
console.log("Recipient:", phone);
console.log("OTP Code:", otp);

async function run() {
  const params = new URLSearchParams({
    user,
    number: phone,
    mobile: phone,
    senderid: senderId,
    message,
    tid,
    type: "txt",
    prettyprint: "1",
  });

  const res = await fetch("https://smshorizon.com/api/v2/sendsms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await res.text();
  console.log("Status:", res.status, res.statusText);
  try {
    console.log("Response:", JSON.parse(text));
  } catch {
    console.log("Response:", text);
  }
}

run().catch(console.error);
