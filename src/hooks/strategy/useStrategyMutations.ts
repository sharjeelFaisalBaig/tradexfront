import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStrategy,
  updateStrategy,
  copyStrategy,
  toggleStrategy,
  favouriteStrategy,
  createImagePeer,
  createAudioPeer,
  createVideoPeer,
  createDocumentPeer,
  createSocialPeer,
  createThreadPeer,
  createRemotePeer,
  uploadAudioContent,
  uploadVideoContent,
  uploadDocumentContent,
  uploadImageContent,
  deleteImagePeer,
  deleteAudioPeer,
  deleteVideoPeer,
  deleteDocumentPeer,
  deleteSocialPeer,
  deleteRemotePeer,
  deleteThreadPeer,
  savePeerPositions,
  updatePeerPosition,
  analyzeSocialPeer,
  connectNodes,
  disconnectNodes,
  sendChatMessage,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  analyzeRemotePeer,
  analyzeImagePeer,
  updateConversationAiModel,
  analyzeVideoPeer,
  analyzeDocumentPeer,
  analyzeAudioPeer,
  resetPeer,
  createAnnotationPeer,
  updateAnnotationContent,
  deleteAnnotationPeer,
  sendPeerAiNote,
} from "@/services/strategy/strategy_Mutation";
import { IStrategy } from "@/lib/types";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IStrategy>) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STRATEGIES] });
    },
  });
};

export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IStrategy> }) =>
      updateStrategy(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STRATEGY, id],
      });
    },
  });
};

export const useCopyStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => copyStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STRATEGIES] });
    },
  });
};

export const useToggleStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleStrategy(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STRATEGIES] });
    },
  });
};

export const useFavouriteStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_favourite }: { id: string; is_favourite: boolean }) =>
      favouriteStrategy(id, is_favourite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STRATEGIES] });
    },
  });
};

export const useSavePeerPositions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      positions,
    }: {
      strategyId: string;
      positions: Array<{
        type: string;
        peer_id: string;
        position_x: number;
        position_y: number;
      }>;
    }) => savePeerPositions({ strategyId, positions }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useSendPeerAiNote = () => {
  return useMutation({
    mutationFn: ({
      strategyId,
      peerType,
      peerId,
      data,
    }: {
      strategyId: string;
      peerType: string;
      peerId: string;
      data: { ai_notes?: string };
    }) => sendPeerAiNote({ strategyId, peerId, peerType, data }),
  });
};

export const useUpdatePeerPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      peerType,
      position_x,
      position_y,
    }: {
      strategyId: string;
      peerId: string;
      peerType: string;
      position_x: number;
      position_y: number;
    }) =>
      updatePeerPosition({
        strategyId,
        peerId,
        peerType,
        position_x,
        position_y,
      }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateAnnotationPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createAnnotationPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateImagePeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createImagePeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //      queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateAudioPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createAudioPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateVideoPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createVideoPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateDocumentPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createDocumentPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateSocialPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createSocialPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateThreadPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createThreadPeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateRemotePeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, data }: { strategyId: string; data: any }) =>
      createRemotePeer(strategyId, data),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Upload annotation node Content
export const useUpdateAnnotationContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: {
        annotation_message: string;
        data: {
          color: string;
        };
      };
    }) => updateAnnotationContent({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Upload Image Content
export const useUploadImageContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: any;
    }) => uploadImageContent({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Upload Audio Content
export const useUploadAudioContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: {
        file: any;
        title: string;
      };
    }) => uploadAudioContent({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Upload Video Content
export const useUploadVideoContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: {
        file: any;
        title: string;
      };
    }) => uploadVideoContent({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Upload Document Content
export const useUploadDocumentContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: {
        file: any;
        title: string;
      };
    }) => uploadDocumentContent({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete annotation Peer
export const useDeleteAnnotationPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteAnnotationPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Image Peer
export const useDeleteImagePeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteImagePeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Audio Peer
export const useDeleteAudioPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteAudioPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Video Peer
export const useDeleteVideoPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteVideoPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Document Peer
export const useDeleteDocumentPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteDocumentPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Social Peer
export const useDeleteSocialPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteSocialPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Remote Peer
export const useDeleteRemotePeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteRemotePeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

// Delete Thread Peer
export const useDeleteThreadPeer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
    }: {
      strategyId: string;
      peerId: string;
    }) => deleteThreadPeer({ strategyId, peerId }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeSocialPeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: any;
    }) => analyzeSocialPeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeRemotePeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: { search_query: string; ai_notes?: string };
    }) => analyzeRemotePeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeImagePeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: { ai_notes?: string };
    }) => analyzeImagePeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeVideoPeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: { ai_notes?: string };
    }) => analyzeVideoPeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeDocumentPeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: { ai_notes?: string };
    }) => analyzeDocumentPeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useAnalyzeAudioPeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      peerId,
      data,
    }: {
      strategyId: string;
      peerId: string;
      data: { ai_notes?: string };
    }) => analyzeAudioPeer({ strategyId, peerId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useConnectNodes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      data,
    }: {
      strategyId: string;
      data: {
        source_peer_type: string;
        source_peer_id: string;
        thread_peer_id: string;
      };
    }) => connectNodes({ strategyId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useDisconnectNodes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      data,
    }: {
      strategyId: string;
      data: {
        source_peer_type: string;
        source_peer_id: string;
        thread_peer_id: string;
      };
    }) => disconnectNodes({ strategyId, data }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      data,
    }: {
      strategyId: string;
      data: {
        title: string;
        ai_thread_peer_id: string;
      };
    }) => createConversation({ strategyId, data }),

    onSuccess: (_res, { strategyId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, strategyId],
      });
    },
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      conversationId,
      data,
    }: {
      strategyId: string;
      conversationId: string;
      data: {
        title: string;
      };
    }) =>
      updateConversationTitle({
        strategyId,
        conversationId,
        data,
      }),

    onSuccess: (_res, { strategyId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, strategyId],
      });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      conversationId,
    }: {
      strategyId: string;
      conversationId: string;
    }) =>
      deleteConversation({
        strategyId,
        conversationId,
      }),

    onSuccess: (_res, { strategyId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, strategyId],
      });
    },
  });
};

export const useUpdateConversationAiModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      conversationId,
      data,
    }: {
      strategyId: string;
      conversationId: string;
      data: {
        ai_model_id: string;
      };
    }) =>
      updateConversationAiModel({
        strategyId,
        conversationId,
        data,
      }),

    onSuccess: (_res, { strategyId, conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, strategyId, conversationId],
      });
    },
  });
};

export const useResetPeer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      peerId,
      peerType,
      strategyId,
    }: {
      peerId: string;
      peerType: string;
      strategyId: string;
    }) => resetPeer({ strategyId, peerId, peerType }),
    // onSuccess: (_data, { strategyId }) => {
    //   queryClient.invalidateQueries({
    //     queryKey: [QUERY_KEYS.STRATEGY, strategyId],
    //   });
    // },
  });
};

export const useSendChatMessage = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      data,
    }: {
      strategyId: string;
      data: {
        message: string;
        conversation_id: string;
        strategy_collaborator_id?: string;
      };
    }) => sendChatMessage({ strategyId, data }),
  });
};

// important code please don't remove
// export const useSendChatMessage = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       strategyId,
//       data,
//     }: {
//       strategyId: string;
//       data: {
//         message: string;
//         conversation_id: string;
//         strategy_collaborator_id?: string;
//       };
//     }) => sendChatMessage({ strategyId, data }),

//     onSuccess: (res, { strategyId, data }) => {
//       const queryKey = [
//         QUERY_KEYS.CONVERSATION,
//         QUERY_KEYS.CHAT,
//         data.conversation_id,
//         strategyId,
//       ];

//       // Create message object from API response
//       const aiMessage = {
//         id: `ai-${Date.now()}`, // Temporary ID
//         message: res.response, // AI response text
//         sender: "ai", // or "assistant", etc.
//         timestamp: new Date().toISOString(),
//       };

//       // Optionally, also push user's original message
//       const userMessage = {
//         id: `user-${Date.now()}`,
//         message: data.message,
//         sender: "user",
//         timestamp: new Date().toISOString(),
//       };

//       // Update query cache directly
//       queryClient.setQueryData(queryKey, (oldData: any) => {
//         if (!oldData) return oldData;

//         return {
//           ...oldData,
//           messages: [...(oldData.messages || []), userMessage, aiMessage],
//         };
//       });
//     },
//   });
// };
