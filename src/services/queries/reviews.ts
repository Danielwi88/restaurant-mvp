import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/services/api/axios";
import { toast } from "sonner";
import type { AxiosError } from "axios";

type CreateReviewBody = {
  transactionId: string;
  restaurantId: number | string;
  star: number;
  comment?: string;
};

type CreateReviewResponse = {
  success?: boolean;
  message?: string;
  data?: { review?: { id?: number | string } };
};

type UpdateReviewResponse = { success?: boolean; message?: string };


type ReviewConflictPayload = { data?: { review?: { id?: number | string } }; message?: string };

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateReviewBody) => {
      try {
        const res = await apiPost<CreateReviewResponse>("review", body);
        return { res, body };
      } catch (e) {
        const ax = e as AxiosError<ReviewConflictPayload>;
        if (ax?.response?.status === 409) {
          let existingId: string | number | undefined = ax?.response?.data?.data?.review?.id;
          if (existingId == null && body?.restaurantId) {
            try {
              type MyReviewsResponse = {
                data?: { reviews?: Array<{ id?: number | string; restaurant?: { id?: number | string } }> };
              };
              const my = await apiGet<MyReviewsResponse>('review/my-reviews', { page: 1, limit: 100 });
              const list = my?.data?.reviews ?? [];
              const target = list.find(r => {
                const ridNum = Number(body.restaurantId);
                const rRestId = r?.restaurant?.id;
                if (rRestId == null) return false;
                const rNum = Number(rRestId);
                return (Number.isFinite(ridNum) && Number.isFinite(rNum)) ? (rNum === ridNum) : String(rRestId) === String(body.restaurantId);
              });
              existingId = target?.id;
            } catch {
              /* ignore */
            }
          }
          const errObj = new Error(ax?.response?.data?.message || "Review already exists");
          (errObj as { code?: string; reviewId?: string | number; restaurantId?: string | number }).code =
            "ALREADY_REVIEWED";
          (errObj as { code?: string; reviewId?: string | number; restaurantId?: string | number }).reviewId =
            existingId;
          (errObj as { code?: string; reviewId?: string | number; restaurantId?: string | number }).restaurantId =
            body?.restaurantId;
          throw errObj;
        }
        throw e;
      }
    },
    onSuccess: async ({ res, body }: { res: { message?: string }; body: CreateReviewBody }) => {
      toast.success(res?.message || "Review created successfully");
      qc.invalidateQueries({ queryKey: ["orders"], exact: false });
      if (body?.restaurantId != null) {
        qc.invalidateQueries({ queryKey: ["restaurant", String(body.restaurantId)], exact: false });
      }
    },
    onError: async (err: unknown) => {
      const ax = err as AxiosError<{ message?: string }>;
      if ((err as { code?: string }).code === "ALREADY_REVIEWED" || ax?.response?.status === 409) return;
      toast.error(ax?.response?.data?.message || (err instanceof Error ? err.message : "Failed to create review"));
    },
  });
};

export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { reviewId: string | number; star: number; comment?: string }) => {
      const res = await apiPut<UpdateReviewResponse>(`review/${body.reviewId}`, {
        star: body.star,
        comment: body.comment ?? "",
      });
      return res;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Review updated successfully");
      qc.invalidateQueries({ queryKey: ["orders"], exact: false });
      qc.invalidateQueries({ queryKey: ["restaurant"], exact: false });
    },
  });
};
