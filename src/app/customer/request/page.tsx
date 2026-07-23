"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LiveLoanCalculator } from "@/components/calculator/live-loan-calculator";
import { requestLoan } from "./actions";
import { VerificationBadge } from "@/components/ui/status-badge";

export default function RequestLoanPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  const canRequest = profile.verification_status === "verified";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await requestLoan({
      amount: parseFloat(amount) || 0,
      purpose,
      durationDays: parseInt(durationDays, 10) || 0,
      interestRateAnnual: parseFloat(interestRate) || 0,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan request submitted.");
    router.push("/customer/loans");
  }

  if (!canRequest) {
    return (
      <Card className="max-w-xl">
        <div className="flex items-center justify-between mb-2">
          <CardTitle>You're not verified yet</CardTitle>
          <VerificationBadge status={profile.verification_status} />
        </div>
        <CardDescription>
          Complete verification before requesting a loan from your organization.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl grid md:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Request a loan</CardTitle>
          <CardDescription>Submitted to your organization's admins for review.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Amount (₹)" htmlFor="amount">
            <Input
              id="amount"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
            />
          </Field>
          <Field label="Purpose" htmlFor="purpose">
            <Textarea
              id="purpose"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is this loan for?"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (days)" htmlFor="duration">
              <Input
                id="duration"
                type="number"
                min={1}
                required
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="e.g. 90"
              />
            </Field>
            <Field label="Interest rate — annual % (optional)" htmlFor="rate">
              <Input
                id="rate"
                type="number"
                min={0}
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            Submit request
          </Button>
        </form>
      </Card>

      <div className="md:sticky md:top-24">
        <LiveLoanCalculator
          amount={parseFloat(amount) || 0}
          interestRate={parseFloat(interestRate) || 0}
          durationDays={parseInt(durationDays, 10) || 0}
        />
      </div>
    </div>
  );
}
