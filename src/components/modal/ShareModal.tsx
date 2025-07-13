"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IStrategy } from "@/lib/types";
import { useSession } from "next-auth/react";
import {
  inviteCollaborator,
  deleteInvitation,
} from "@/services/strategy/strategy_Mutation";
import { getStrategyInvitations } from "@/services/strategy/strategy_API";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  strategy: IStrategy | null;
}

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  strategy,
}) => {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (strategy && session) {
        try {
          const res = await getStrategyInvitations(strategy.id, session);
          if (res.status) {
            setInvitedUsers(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch invitations", error);
        }
      }
    };

    if (open) {
      fetchInvitations();
    }
  }, [strategy, open, session]);

  const handleInvite = async () => {
    if (strategy && email && session) {
      try {
        const res = await inviteCollaborator(strategy.id, email, session);
        if (res.status) {
          // Refetch invitations to show the new user
          const newInvitations = await getStrategyInvitations(strategy.id, session);
          if (newInvitations.status) {
            setInvitedUsers(newInvitations.data);
          }
          setEmail("");
          setError(null);
        } else {
          setError(res.message);
        }
      } catch (error: any) {
        console.error("Failed to invite collaborator", error);
        setError(error.message || "An unexpected error occurred.");
      }
    }
  };

  const handleRemove = async (invitationId: string) => {
    if (strategy && session) {
      try {
        const res = await deleteInvitation(invitationId, session);
        if (res.status) {
          // Refetch invitations to remove the user
          const newInvitations = await getStrategyInvitations(strategy.id, session);
          if (newInvitations.status) {
            setInvitedUsers(newInvitations.data);
          }
        }
      } catch (error) {
        console.error("Failed to remove invitation", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 rounded-lg shadow-xl">
        <DialogTitle className="sr-only">Share Settings</DialogTitle>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Share {strategy?.name}</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            type="email"
            placeholder="Enter email to invite"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
          <Button onClick={handleInvite}>Invite</Button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            People with access
          </p>
          <div className="space-y-2">
            {invitedUsers.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={invitation.invited_user.avatar ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${invitation.invited_user.avatar}` : "/logo.png"}
                    alt={invitation.invited_user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-medium text-sm">{invitation.invited_user.name}</p>
                    <p className="text-xs text-muted-foreground">{invitation.invited_user.email}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(invitation.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
