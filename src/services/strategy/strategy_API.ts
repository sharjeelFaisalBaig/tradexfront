import { endpoints } from "@/lib/endpoints";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { Session } from "next-auth";

interface IStrategyFilterOptions {
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    search?: string;
}

export const getStrategies = async (session: Session | null, options: IStrategyFilterOptions) => {
    const params: Record<string, string> = {
        role: 'owner',
        is_active: 'true',
        sort_by: options.sort_by || 'updated_at',
        sort_order: options.sort_order || 'desc',
        per_page: options.per_page?.toString() || '10',
    };

    if (options.search) {
        params.search = options.search;
    }

    const url = `${endpoints.STRATEGY.LIST}?${new URLSearchParams(params).toString()}`;
    return fetchWithAutoRefresh(url, session);
};

export const getFavoriteStrategies = async (session: Session | null, options: IStrategyFilterOptions) => {
    const params: Record<string, string> = {
        role: 'owner',
        is_active: 'true',
        favourites: 'true',
        sort_by: options.sort_by || 'updated_at',
        sort_order: options.sort_order || 'desc',
        per_page: options.per_page?.toString() || '10',
    };

    if (options.search) {
        params.search = options.search;
    }

    const url = `${endpoints.STRATEGY.LIST}?${new URLSearchParams(params).toString()}`;
    return fetchWithAutoRefresh(url, session);
};

export const getRecentStrategies = async (session: Session | null, options: Omit<IStrategyFilterOptions, 'sort_by' | 'sort_order'>) => {
    const params: Record<string, string> = {
        role: 'owner',
        is_active: 'true',
        sort_by: 'updated_at',
        sort_order: 'desc',
        per_page: options.per_page?.toString() || '10',
    };

    if (options.search) {
        params.search = options.search;
    }

    const url = `${endpoints.STRATEGY.LIST}?${new URLSearchParams(params).toString()}`;
    return fetchWithAutoRefresh(url, session);
};

export const getStrategy = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET(id), session);
};

export const getMyInvitations = async (session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET_MY_INVITATIONS, session);
};

export const getSharedStrategies = async (session: Session | null, params: Record<string, any> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAutoRefresh(`${endpoints.STRATEGY.GET_MY_INVITATIONS}?${queryString}`, session);
};

export const getStrategyInvitations = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET_STRATEGY_INVITATIONS(id), session);
};

export const getSubscribedUsers = async (session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET_SUBSCRIBED_USERS, session);
};

export const listTemplates = async (session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.TEMPLATE.LIST, session);
};

export const getTemplateDetails = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.TEMPLATE.GET(id), session);
};

export const listFolders = async (tree: boolean, session: Session | null) => {
    const url = `${endpoints.FOLDER.LIST}?tree=${tree}`;
    return fetchWithAutoRefresh(url, session);
};

export const getFolderDetails = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.GET(id), session);
};

export const getStrategiesInFolder = async (id: string, session: Session | null) => {
    return fetchWithAutoRefresh(endpoints.FOLDER.GET_STRATEGIES(id), session);
};

export async function getStrategyShareInvitations(session: any) {
    return fetchWithAutoRefresh(endpoints.STRATEGY.GET_MY_INVITATIONS, session);
}
