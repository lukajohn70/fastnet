import { useState } from "react";
import AdminLogin from "./admin/AdminLogin";
import AdminShell from "./admin/AdminShell";
import { type Plan } from "../types";

interface Props {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
}

export default function AdminApp({ plans, setPlans }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <AdminShell plans={plans} setPlans={setPlans} onLogout={() => setLoggedIn(false)} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} />
  );
}
