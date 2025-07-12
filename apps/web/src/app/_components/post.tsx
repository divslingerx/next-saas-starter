"use client";

import { useState } from "react";

import { api } from "@charmlabs/api/client";
import { Button } from "@charmlabs/ui/button";
import { Input } from "@charmlabs/ui/input";
export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {latestPost ? (
        <p className="text-lg font-medium text-center mb-4">
          Your most recent post: {latestPost.name}
        </p>
      ) : (
        <p className="text-lg font-medium text-center mb-4 text-muted-foreground">
          You have no posts yet.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-4"
      >
        <Input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          type="submit"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
