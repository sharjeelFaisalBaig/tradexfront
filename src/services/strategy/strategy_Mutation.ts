import { endpoints } from "@/lib/endpoints";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { IStrategy } from "@/lib/types";
import { Session } from "next-auth";

export const createStrategy = async (data: Partial<IStrategy>, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.CREATE, session, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateStrategy = async (id: string, data: Partial<IStrategy>, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.UPDATE(id), session, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
};

export const copyStrategy = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.COPY(id), session, {
        method: "POST",
    });
};

export const toggleStrategy = async (id: string, is_active: boolean, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.TOGGLE(id), session, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
    });
};

export const favouriteStrategy = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.FAVOURITE(id), session, {
        method: "PATCH",
    });
};

export const inviteCollaborator = async (id: string, email: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.SEND_INVITATION(id), session, {
        method: "POST",
        body: JSON.stringify({ email }),
    });
};

export const acceptInvitation = async (id: string, message: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.ACCEPT_INVITATION(id), session, {
        method: "PATCH",
        body: JSON.stringify({ message }),
    });
};

export const rejectInvitation = async (id: string, message: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.REJECT_INVITATION(id), session, {
        method: "PATCH",
        body: JSON.stringify({ message }),
    });
};

export const toggleTemplateStatus = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.TEMPLATE.TOGGLE(id), session, {
        method: "PATCH",
    });
};

export const useTemplate = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.TEMPLATE.USE(id), session, {
        method: "POST",
    });
};

export const createFolder = async (name: string, description: string, parent_id: number | null, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.CREATE, session, {
        method: "POST",
        body: JSON.stringify({ name, description, parent_id }),
    });
};

export const updateFolder = async (id: string, name: string, description: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.UPDATE(id), session, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
    });
};

export const removeCollaborator = async (id: string, collaborator_id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.REMOVE_COLLABORATOR(id, collaborator_id), session, {
        method: "DELETE",
    });
};

export const deleteInvitation = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.DELETE_INVITATION(id), session, {
        method: "DELETE",
    });
};

export const moveFolder = async (id: string, parent_id: number, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.MOVE(id), session, {
        method: "PATCH",
        body: JSON.stringify({ parent_id }),
    });
};

export const deleteFolder = async (id: string, action: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.DELETE(id), session, {
        method: "DELETE",
        body: JSON.stringify({ action }),
    });
};

export const moveStrategyToFolder = async (strategy_id: string, folder_id: number, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.MOVE_TO_FOLDER(strategy_id), session, {
        method: "PATCH",
        body: JSON.stringify({ folder_id }),
    });
};