import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/services/api/axios";
import { showToast } from "@/lib/toast";

type CreateReviewBody = {
  transactionId: string;
  restaurantId: number | string;
  star: number;
  comment?: string;
};

type CreateReviewResponse = {
  success?: boolean;
  message?: string;
  data?: {
    review?: {
      id?: number | string;
      star?: number;
      comment?: string;
      createdAt?: string;
      user?: { id?: number | string; name?: string };
      restaurant?: { id?: number | string; name?: string };
    }
  }
};

export const useCreateReview = () =>
  useMutation({
    mutationFn: async (body: CreateReviewBody) => {
      const res = await apiPost<CreateReviewResponse>('review', body);
      return res;
    },
    onSuccess: (res) => {
      const msg = res?.message || 'Review created successfully';
      showToast(msg, 'success');
    },
  });

