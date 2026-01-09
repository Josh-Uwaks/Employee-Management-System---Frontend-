// lib/toast.ts
import { toast, ToastT } from 'sonner';

type ToastOptions = Partial<ToastT>;

export const showToast = {
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options,
    });
  },
  
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      ...options,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },
};