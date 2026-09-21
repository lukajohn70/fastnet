import { useState } from "react";
import WelcomePlan from "./customer/WelcomePlan";
import PaystackCheckout from "./customer/PaystackCheckout";
import PaymentSuccess from "./customer/PaymentSuccess";
import MikroTikLogin from "./customer/MikroTikLogin";
import { type Plan } from "../types";
import {
  createHotspotUser,
  generateVoucherCode,
  savePaymentRecord,
  getRouterConfig,
} from "../services/mikrotik";

export type CustomerScreen = "welcome" | "checkout" | "success" | "login";

interface Props {
  plans: Plan[];
  onOpenAdmin: () => void;
}

export default function CustomerApp({ plans, onOpenAdmin }: Props) {
  const [screen, setScreen] = useState<CustomerScreen>("welcome");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0] || {
    id: "default",
    name: "1 Hour",
    duration: "1 hour",
    price: 500,
    features: ["Unlimited data", "High speed", "Instant access"],
  });
  const [voucher, setVoucher] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });

  const handlePaymentSuccess = async () => {
    const code = generateVoucherCode("user");
    const pwd = generateVoucherCode("pwd").replace("pwd_", "");
    const txRef = `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Map plan duration to MikroTik limit-uptime
    let limitUptime = "1h";
    if (selectedPlan.duration.includes("hour")) {
      const match = selectedPlan.duration.match(/\d+/);
      limitUptime = match ? `${match[0]}h` : "1h";
    } else if (selectedPlan.duration.includes("day") || selectedPlan.duration.includes("Week")) {
      const match = selectedPlan.duration.match(/\d+/);
      limitUptime = match ? `${parseInt(match[0]) * 24}h` : "168h";
    }

    try {
      const cfg = getRouterConfig();
      // Attempt to provision on router
      await createHotspotUser({
        name: code,
        password: pwd,
        profile: cfg.hotspotProfile || "default",
        comment: `${txRef} · ${selectedPlan.name}`,
        limitUptime,
      });
    } catch (err) {
      console.warn("Could not reach router directly, voucher saved locally:", err);
    }

    // Record transaction
    savePaymentRecord({
      ref: txRef,
      username: code,
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      status: "paid",
    });

    setVoucher({ username: code, password: pwd });
    setScreen("success");
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F3F4F6]">
      {screen === "welcome" && (
        <WelcomePlan
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onPay={() => setScreen("checkout")}
          onOpenAdmin={onOpenAdmin}
        />
      )}
      {screen === "checkout" && (
        <PaystackCheckout
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setScreen("welcome")}
        />
      )}
      {screen === "success" && (
        <PaymentSuccess
          plan={selectedPlan}
          voucher={voucher}
          onConnect={() => setScreen("login")}
        />
      )}
      {screen === "login" && <MikroTikLogin voucher={voucher} />}
    </div>
  );
}
