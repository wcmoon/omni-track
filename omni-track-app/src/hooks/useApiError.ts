import { useToast } from '../components/common/ToastProvider';
import { errorHandler, ErrorType } from '../services/errorHandler';

// 自定义钩子用于处理API错误
export const useApiError = () => {
  const { showToast } = useToast();

  const handleError = (error: any, context?: string) => {
    const errorInfo = errorHandler.parseError(error);
    
    // 记录错误
    errorHandler.logError(error, context);

    // 根据错误类型决定是否显示toast
    switch (errorInfo.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        // 认证错误由API拦截器处理，这里不需要显示toast
        break;
      case ErrorType.VALIDATION_ERROR:
        // 显示验证错误
        showToast(errorInfo.message, 'error');
        break;
      case ErrorType.NETWORK_ERROR:
        // 网络错误由API拦截器处理，这里不需要显示toast
        break;
      case ErrorType.SERVER_ERROR:
        // 服务器错误由API拦截器处理，这里不需要显示toast
        break;
      default:
        // 其他错误显示通用消息
        showToast(errorInfo.message, 'error');
        break;
    }

    return errorInfo;
  };

  const getErrorMessage = (error: any): string => {
    return errorHandler.getUserFriendlyMessage(error);
  };

  return {
    handleError,
    getErrorMessage,
  };
};