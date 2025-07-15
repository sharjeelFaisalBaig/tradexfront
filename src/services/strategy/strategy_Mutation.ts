import { endpoints } from "@/lib/endpoints";
import { IStrategy } from "@/lib/types";
import axiosInstance from "../axios";

export const createStrategy = async (data: Partial<IStrategy>) => {
  const res = await axiosInstance.post(endpoints.STRATEGY.CREATE, data);
  return res.data;
};

export const updateStrategy = async (id: string, data: Partial<IStrategy>) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.UPDATE(id), data);
  return res.data;
};

export const copyStrategy = async (id: string) => {
  const res = await axiosInstance.post(endpoints.STRATEGY.COPY(id));
  return res.data;
};

export const toggleStrategy = async (id: string, is_active: boolean) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.TOGGLE(id), {
    is_active,
  });
  return res.data;
};

export const favouriteStrategy = async (id: string, is_favourite: boolean) => {
  const res = await axiosInstance.put(endpoints.STRATEGY.FAVOURITE(id), {
    is_favourite,
  });
  return res.data;
};

export const savePeerPositions = async ({
  strategyId,
  positions,
}: {
  strategyId: string;
  positions: Array<{
    peer_id: string;
    position_x: number;
    position_y: number;
  }>;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.SAVE_PEER_POSITIONS(strategyId),
    { positions }
  );
  return res.data;
};

export const updatePeerPosition = async ({
  strategyId,
  peerId,
  peerType,
  position_x,
  position_y,
}: {
  strategyId: string;
  peerId: string;
  peerType: string; // "image", "audio", etc.
  position_x: number;
  position_y: number;
}) => {
  const res = await axiosInstance.put(
    endpoints.STRATEGY.UPDATE_PEER_POSITIONS(strategyId, peerId, peerType),
    {
      position_x,
      position_y,
    }
  );
  return res.data;
};

// Board Peers API calls
export const createImagePeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_IMAGE_PEER(strategyId),
    data
  );
  return res.data;
};

export const createAudioPeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_AUDIO_PEER(strategyId),
    data
  );
  return res.data;
};

export const createVideoPeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_VIDEO_PEER(strategyId),
    data
  );
  return res.data;
};

export const createDocumentPeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_DOCUMENT_PEER(strategyId),
    data
  );
  return res.data;
};

export const createSocialPeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_SOCIAL_PEER(strategyId),
    data
  );
  return res.data;
};

export const createThreadPeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_THREAD_PEER(strategyId),
    data
  );
  return res.data;
};

export const createRemotePeer = async (strategyId: string, data: any) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_REMOTE_PEER(strategyId),
    data
  );
  return res.data;
};

// Upload peer content APIs
export const uploadImageContent = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: any;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.UPLOAD_IMAGE_CONTENT({ strategyId, peerId }),
    data,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

export const uploadAudioContent = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: any;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.UPLOAD_AUDIO_CONTENT({ strategyId, peerId }),
    data
  );
  return res.data;
};

export const uploadVideoContent = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: any;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.UPLOAD_VIDEO_CONTENT({ strategyId, peerId }),
    data
  );
  return res.data;
};

export const uploadDocumentContent = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: any;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.UPLOAD_DOCUMENT_CONTENT({ strategyId, peerId }),
    data
  );
  return res.data;
};

// Delete peer content APIs
export const deleteImagePeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_IMAGE_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteAudioPeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_AUDIO_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteVideoPeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_VIDEO_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteDocumentPeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_DOCUMENT_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteSocialPeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_SOCIAL_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteRemotePeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_REMOTE_PEER(strategyId, peerId)
  );
  return res.data;
};

export const deleteThreadPeer = async ({
  strategyId,
  peerId,
}: {
  strategyId: string;
  peerId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_THREAD_PEER(strategyId, peerId)
  );
  return res.data;
};

export const analyzeSocialPeer = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: any;
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.ANALYZE_PEER({
      peerId,
      id: strategyId,
      peerType: "social_media",
    }),
    data
  );
  return res.data;
};

export const analyzeRemotePeer = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: {
    search_query: string;
    ai_notes?: string;
  };
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.ANALYZE_PEER({
      peerId,
      id: strategyId,
      peerType: "remote",
    }),
    data
  );
  return res.data;
};

export const analyzeImagePeer = async ({
  strategyId,
  peerId,
  data,
}: {
  strategyId: string;
  peerId: string;
  data: {
    ai_notes?: string;
  };
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.ANALYZE_PEER({
      peerId,
      id: strategyId,
      peerType: "image",
    }),
    data
  );
  return res.data;
};

export const connectNodes = async ({
  strategyId,
  data,
}: {
  strategyId: string;
  data: {
    source_peer_type: string;
    source_peer_id: string;
    thread_peer_id: string;
  };
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CONNECT_NODES(strategyId),
    data
  );
  return res.data;
};

export const disconnectNodes = async ({
  strategyId,
  data,
}: {
  strategyId: string;
  data: {
    source_peer_type: string;
    source_peer_id: string;
    thread_peer_id: string;
  };
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DISCONNECT_NODES(strategyId),
    { data }
  );
  return res.data;
};

export const sendChatMessage = async ({
  strategyId,
  data,
}: {
  strategyId: string;
  data: {
    message: string;
    conversation_id: string;
    strategy_collaborator_id?: string;
  };
}) => {
  const res = await axiosInstance.post(
    endpoints.CHAT_BOX.CHAT(strategyId),
    data
  );
  return res.data;
};

// need to review this api mutation
export const createConversation = async ({
  strategyId,
  data,
}: {
  strategyId: string;
  data: {
    title: string;
    ai_thread_peer_id: string;
  };
}) => {
  const res = await axiosInstance.post(
    endpoints.STRATEGY.CREATE_CONVERSATION(strategyId),
    data
  );
  return res.data;
};

// need to review this api mutation
export const updateConversationTitle = async ({
  strategyId,
  conversationId,
  data,
}: {
  strategyId: string;
  conversationId: string;
  data: {
    title: string;
  };
}) => {
  const res = await axiosInstance.put(
    endpoints.STRATEGY.UPDATE_CONVERSATION_TITLE(strategyId, conversationId),
    data
  );
  return res.data;
};

// need to review this api mutation
export const deleteConversation = async ({
  strategyId,
  conversationId,
}: {
  strategyId: string;
  conversationId: string;
}) => {
  const res = await axiosInstance.delete(
    endpoints.STRATEGY.DELETE_CONVERSATION(strategyId, conversationId)
  );
  return res.data;
};
