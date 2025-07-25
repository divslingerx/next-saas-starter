"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { client } from "@charmlabs/core";
import { Button } from "@charmlabs/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@charmlabs/ui/components/card";
import { Input } from "@charmlabs/ui/components/input";
import { Label } from "@charmlabs/ui/components/label";

export default function Component() {
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
      setError("TOTP code must be 6 digits");
      return;
    }
    client.twoFactor
      .verifyTotp({
        code: totpCode,
      })
      .then((res) => {
        if (res.data?.token) {
          setSuccess(true);
          setError("");
        } else {
          setError("Invalid TOTP code");
        }
      });
  };

  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>TOTP Verification</CardTitle>
          <CardDescription>
            Enter your 6-digit TOTP code to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="totp">TOTP Code</Label>
                <Input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center text-red-500">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <Button type="submit" className="mt-4 w-full">
                Verify
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold">Verification Successful</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2 text-sm text-muted-foreground">
          <Link href="/two-factor/otp">
            <Button variant="link" size="sm">
              Switch to Email Verification
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
