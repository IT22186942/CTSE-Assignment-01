import { useEffect, useMemo, useState } from "react";
import { contractApi, notificationApi, paymentApi, userApi } from "./api";

const initialRegister = { name: "", email: "", password: "", role: "student" };
const initialLogin = { email: "", password: "" };
const initialContract = { title: "", details: "" };
const initialPayment = { contractId: "", amount: "" };

export default function App() {
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [contractForm, setContractForm] = useState(initialContract);
  const [paymentForm, setPaymentForm] = useState(initialPayment);
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [message, setMessage] = useState("Welcome to Smart Mall Management.");

  const isAdmin = useMemo(() => currentUser?.role === "admin", [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchContracts();
      fetchNotifications();
    }
  }, [currentUser]);

  async function handleRegister(event) {
    event.preventDefault();
    try {
      const response = await userApi.post("/register", registerForm);
      setMessage(response.data.message || "Registered successfully");
      setRegisterForm(initialRegister);
    } catch (error) {
      setMessage(error.response?.data?.message || "Register failed");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const response = await userApi.post("/login", loginForm);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      setMessage("Login successful");
      setLoginForm(initialLogin);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setContracts([]);
    setNotifications([]);
    setMessage("Logged out");
  }

  async function applyContract(event) {
    event.preventDefault();
    if (!currentUser) {
      setMessage("Please login first");
      return;
    }

    try {
      const response = await contractApi.post("/contracts/apply", {
        userId: currentUser.id,
        title: contractForm.title,
        details: contractForm.details
      });
      setMessage(response.data.message || "Contract applied");
      setContractForm(initialContract);
      fetchContracts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Contract apply failed");
    }
  }

  async function fetchContracts() {
    try {
      const response = await contractApi.get("/contracts");
      setContracts(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to fetch contracts");
    }
  }

  async function approveContract(contractId) {
    try {
      const response = await contractApi.put(`/contracts/${contractId}/approve`);
      setMessage(response.data.message || "Contract approved");
      fetchContracts();
      fetchNotifications();
    } catch (error) {
      setMessage(error.response?.data?.message || "Contract approval failed");
    }
  }

  async function makePayment(event) {
    event.preventDefault();
    if (!currentUser) {
      setMessage("Please login first");
      return;
    }

    try {
      const response = await paymentApi.post("/payments/pay", {
        contractId: paymentForm.contractId,
        amount: Number(paymentForm.amount),
        userId: currentUser.id
      });
      setMessage(response.data.message || "Payment successful");
      setPaymentForm(initialPayment);
      fetchNotifications();
    } catch (error) {
      setMessage(error.response?.data?.message || "Payment failed");
    }
  }

  async function fetchNotifications() {
    if (!currentUser) {
      return;
    }

    try {
      const endpoint = isAdmin ? "/notifications" : `/notifications?userId=${currentUser.id}`;
      const response = await notificationApi.get(endpoint);
      setNotifications(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to fetch notifications");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Smart Mall Management System</h1>
        <p>Cloud-native microservices demo for university assignment</p>
        <div className="session-bar">
          <span>{currentUser ? `${currentUser.name} (${currentUser.role})` : "Not logged in"}</span>
          {currentUser && (
            <button type="button" onClick={handleLogout} className="secondary-btn">
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="grid-layout">
        <section className="card">
          <h2>Register</h2>
          <form onSubmit={handleRegister} className="form-stack">
            <input
              value={registerForm.name}
              onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
              placeholder="Name"
              required
            />
            <input
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={registerForm.password}
              onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
              placeholder="Password (min 6)"
              type="password"
              required
            />
            <select
              value={registerForm.role}
              onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Register</button>
          </form>
        </section>

        <section className="card">
          <h2>Login</h2>
          <form onSubmit={handleLogin} className="form-stack">
            <input
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              placeholder="Password"
              type="password"
              required
            />
            <button type="submit">Login</button>
          </form>
        </section>

        <section className="card">
          <h2>Apply Contract</h2>
          <form onSubmit={applyContract} className="form-stack">
            <input
              value={contractForm.title}
              onChange={(event) => setContractForm({ ...contractForm, title: event.target.value })}
              placeholder="Contract title"
              required
            />
            <textarea
              value={contractForm.details}
              onChange={(event) => setContractForm({ ...contractForm, details: event.target.value })}
              placeholder="Contract details"
              rows={3}
              required
            />
            <button type="submit">Apply</button>
          </form>
        </section>

        <section className="card">
          <h2>Make Payment</h2>
          <form onSubmit={makePayment} className="form-stack">
            <input
              value={paymentForm.contractId}
              onChange={(event) => setPaymentForm({ ...paymentForm, contractId: event.target.value })}
              placeholder="Contract ID"
              required
            />
            <input
              value={paymentForm.amount}
              onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
              placeholder="Amount"
              type="number"
              step="0.01"
              min="1"
              required
            />
            <button type="submit">Pay</button>
          </form>
        </section>

        <section className="card wide">
          <div className="card-title-row">
            <h2>Contracts</h2>
            <button type="button" className="secondary-btn" onClick={fetchContracts}>
              Refresh
            </button>
          </div>
          <ul className="list-shell">
            {contracts.map((contract) => (
              <li key={contract.id} className="list-item">
                <div>
                  <strong>{contract.title}</strong>
                  <p>{contract.details}</p>
                  <small>ID: {contract.id}</small>
                  <small>User: {contract.userId}</small>
                  <small>Status: {contract.status}</small>
                </div>
                {isAdmin && contract.status !== "APPROVED" && (
                  <button type="button" onClick={() => approveContract(contract.id)}>
                    Approve Contract
                  </button>
                )}
              </li>
            ))}
            {!contracts.length && <li className="list-empty">No contracts found</li>}
          </ul>
        </section>

        <section className="card wide">
          <div className="card-title-row">
            <h2>Notifications</h2>
            <button type="button" className="secondary-btn" onClick={fetchNotifications}>
              Refresh
            </button>
          </div>
          <ul className="list-shell">
            {notifications.map((item) => (
              <li key={item.id} className="list-item simple">
                <strong>{item.type}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </li>
            ))}
            {!notifications.length && <li className="list-empty">No notifications yet</li>}
          </ul>
        </section>
      </main>

      <footer className="status-line">{message}</footer>
    </div>
  );
}
