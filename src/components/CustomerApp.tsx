import { useState } from "react";
import WelcomePlan from "./customer/WelcomePlan";
import PaystackCheckout from "./customer/PaystackCheckout";
import PaymentSuccess from "./customer/PaymentSuccess";
import MikroTikLogin from "./customer/MikroTikLogin";
import { type Plan } from "../types";

export type CustomerScreen = "welcome" | "checkout" | "success" | "login";

interface Props { plans: Plan[]; }

export default function CustomerApp({ plans }: Props) {
  const [screen, setScreen] = useState<CustomerScreen>("welcome");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0]);
  const [voucher] = useState({ username: "user_ab12c", password: "pwd_456xy" });

  return (
    <div className="h-full overflow-y-auto bg-[#F3F4F6]">
      {screen === "welcome" && (
        <WelcomePlan
          plans={plans}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onPay={() => setScreen("checkout")}
        />
      )}
      {screen === "checkout" && (
        <PaystackCheckout
          plan={selectedPlan}
          onSuccess={() => setScreen("success")}
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
