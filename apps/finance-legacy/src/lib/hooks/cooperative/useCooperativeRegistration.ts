"use client";

import { useMutation } from "@tanstack/react-query";
import { cooperativeService, type RegisterCooperativeInput, type RegisterCooperativeResponse } from "@/lib/api/services/cooperativeService";
import { extractErrorFromResponse } from "@/lib/utils/errorUtils";

interface UseCooperativeRegistrationOptions {
  onSuccess?: (data: RegisterCooperativeResponse) => void;
  onError?: (
    error: any,
    formattedError: { message: string; fieldErrors: Record<string, string>; hasFieldErrors: boolean }
  ) => void;
}

export function useCooperativeRegistration(options?: UseCooperativeRegistrationOptions) {
  return useMutation({
    mutationFn: (data: RegisterCooperativeInput) => cooperativeService.registerCooperative(data),
    onSuccess: (data) => {
      console.log("Cooperative onboarding successful:", data);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error("Cooperative onboarding error:", error);
      const formattedError = extractErrorFromResponse(error);
      options?.onError?.(error, formattedError);
    },
  });
}

export type { RegisterCooperativeInput, RegisterCooperativeResponse };
