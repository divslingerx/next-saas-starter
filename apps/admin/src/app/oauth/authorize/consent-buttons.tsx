"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { client } from "@charmlabs/core";
import { Button } from "@charmlabs/ui/components/button";
import { CardFooter } from "@charmlabs/ui/components/card";

export function ConsentBtns() {
  const [loading, setLoading] = useState(false);
  return (
    <CardFooter className="flex items-center gap-2">
      <Button
        onClick={async () => {
          setLoading(true);
          const res = await client.oauth2.consent({
            accept: true,
          });
          setLoading(false);
          if (res.data?.redirectURI) {
            window.location.href = res.data.redirectURI;
            return;
          }
          toast.error("Failed to authorize");
        }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : "Authorize"}
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          const res = await client.oauth2.consent({
            accept: false,
          });
          if (res.data?.redirectURI) {
            window.location.href = res.data.redirectURI;
            return;
          }
          toast.error("Failed to cancel");
        }}
      >
        Cancel
      </Button>
    </CardFooter>
  );
}
