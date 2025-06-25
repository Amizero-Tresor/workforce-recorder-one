interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class Analytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && !!(window as unknown as any).gtag;
  }

  track(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    (window as unknown as any).gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value
    });
  }

  trackPageView(path: string) {
    if (!this.isEnabled) return;

    (window as unknown as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: path
    });
  }

  trackUserAction(action: string, details?: Record<string, any>) {
    this.track({
      action,
      category: 'user_interaction',
      label: JSON.stringify(details)
    });
  }

  trackError(error: Error, context?: string) {
    this.track({
      action: 'error',
      category: 'application',
      label: `${context}: ${error.message}`
    });
  }

  trackPerformance(metric: string, value: number) {
    this.track({
      action: 'performance',
      category: 'metrics',
      label: metric,
      value
    });
  }
}

export const analytics = new Analytics();

// React hook for tracking
export function useAnalytics() {
  const trackEvent = (event: AnalyticsEvent) => analytics.track(event);
  const trackUserAction = (action: string, details?: Record<string, any>) => 
    analytics.trackUserAction(action, details);

  return { trackEvent, trackUserAction };
}