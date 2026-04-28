const baseUser = process.env.USER_SERVICE_URL || "http://localhost:3001";
const baseContract = process.env.CONTRACT_SERVICE_URL || "http://localhost:3002";
const basePayment = process.env.PAYMENT_SERVICE_URL || "http://localhost:3003";
const baseNotification = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || `HTTP ${response.status}`;
    throw new Error(`${url} failed: ${message}`);
  }

  return data;
}

async function main() {
  const stamp = Date.now();
  const studentEmail = `student${stamp}@example.com`;
  const adminEmail = `admin${stamp}@example.com`;

  const studentReg = await requestJson(`${baseUser}/register`, {
    method: "POST",
    body: JSON.stringify({
      name: "Student One",
      email: studentEmail,
      password: "password123",
      role: "student"
    })
  });

  const adminReg = await requestJson(`${baseUser}/register`, {
    method: "POST",
    body: JSON.stringify({
      name: "Admin One",
      email: adminEmail,
      password: "password123",
      role: "admin"
    })
  });

  const studentLogin = await requestJson(`${baseUser}/login`, {
    method: "POST",
    body: JSON.stringify({ email: studentEmail, password: "password123" })
  });

  const adminLogin = await requestJson(`${baseUser}/login`, {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: "password123" })
  });

  const studentToken = studentLogin.token;
  const adminToken = adminLogin.token;
  const studentId = studentLogin.user.id;

  const contract = await requestJson(`${baseContract}/contracts/apply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      userId: studentId,
      title: "Shop Rental Contract",
      details: "12-month unit rental in smart mall"
    })
  });

  const contractId = contract.contract.id;

  const approved = await requestJson(`${baseContract}/contracts/${contractId}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const payment = await requestJson(`${basePayment}/payments/pay`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      contractId,
      userId: studentId,
      amount: 500
    })
  });

  const notifications = await requestJson(
    `${baseNotification}/notifications?userId=${studentId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${studentToken}` }
    }
  );

  console.log("STEP1_REGISTER=PASS", studentReg.user.id, adminReg.user.id);
  console.log("STEP2_LOGIN=PASS");
  console.log("STEP3_APPLY=PASS", contractId);
  console.log("STEP4_APPROVE=PASS", approved.contract.status);
  console.log("STEP5_PAYMENT=PASS", payment.payment.status);
  console.log("STEP6_NOTIFICATIONS=PASS", notifications.length);
  console.log(
    "NOTIFICATION_TYPES",
    notifications.map((entry) => entry.type).join(",")
  );
}

main().catch((error) => {
  console.error("E2E_CHECK_FAILED", error.message);
  process.exit(1);
});
