import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@charmlabs/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@charmlabs/ui/components/card";

export function InvitationError() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle className="text-xl text-destructive">
            Invitation Error
          </CardTitle>
        </div>
        <CardDescription>
          There was an issue with your invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          The invitation you're trying to access is either invalid or you don't
          have the correct permissions. Please check your email for a valid
          invitation or contact the person who sent it.
        </p>
      </CardContent>
      <CardFooter>
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full">
            Go back to home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
