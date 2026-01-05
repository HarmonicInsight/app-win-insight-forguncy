import { ReactNode } from 'react';
import { useLicenseStore } from '../stores/licenseStore';
import { FeatureLimits } from '../lib/license';

interface FeatureGateProps {
  feature: keyof FeatureLimits;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const checkFeature = useLicenseStore((state) => state.checkFeature);

  if (checkFeature(feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}
