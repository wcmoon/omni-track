import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';

// 创建导航引用
export const navigationRef = createRef<NavigationContainerRef<any>>();

// 导航服务类
class NavigationService {
  // 导航到指定屏幕
  navigate(name: string, params?: any) {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  }

  // 重置导航堆栈
  reset(routeName: string, params?: any) {
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      });
    }
  }

  // 返回上一页
  goBack() {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  }

  // 检查当前路由
  getCurrentRoute() {
    if (navigationRef.current) {
      return navigationRef.current.getCurrentRoute();
    }
    return null;
  }

  // 检查是否可以返回
  canGoBack() {
    if (navigationRef.current) {
      return navigationRef.current.canGoBack();
    }
    return false;
  }
}

export const navigationService = new NavigationService();