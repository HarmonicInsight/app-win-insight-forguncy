import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LicenseValidator,
  LicenseInfo,
  getFeatureLimits,
  FeatureLimits,
  ProductCode,
} from '@insight/license';

interface LicenseState {
  licenseKey: string | null;
  expiresAt: Date | null;
  licenseInfo: LicenseInfo | null;
  limits: FeatureLimits;
  isActivated: boolean;

  setLicense: (key: string, expiresAt?: Date) => void;
  validateLicense: () => LicenseInfo;
  clearLicense: () => void;
  checkFeature: (feature: keyof FeatureLimits) => boolean;
}

const validator = new LicenseValidator();
const PRODUCT_CODE: ProductCode = 'SLIDE';

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      licenseKey: null,
      expiresAt: null,
      licenseInfo: null,
      limits: getFeatureLimits(null),
      isActivated: false,

      setLicense: (key: string, expiresAt?: Date) => {
        const info = validator.validate(key, expiresAt);

        if (info.isValid && validator.isProductCovered(info, PRODUCT_CODE)) {
          set({
            licenseKey: key,
            expiresAt: expiresAt || info.expiresAt,
            licenseInfo: info,
            limits: getFeatureLimits(info.tier),
            isActivated: true,
          });
        } else {
          set({
            licenseKey: key,
            licenseInfo: info,
            isActivated: false,
          });
        }
      },

      validateLicense: () => {
        const { licenseKey, expiresAt } = get();
        if (!licenseKey) {
          return {
            isValid: false,
            product: null,
            tier: null,
            expiresAt: null,
            error: 'No license key',
          };
        }

        const info = validator.validate(licenseKey, expiresAt || undefined);
        const isValid = info.isValid && validator.isProductCovered(info, PRODUCT_CODE);

        set({
          licenseInfo: info,
          limits: getFeatureLimits(info.tier),
          isActivated: isValid,
        });

        return info;
      },

      clearLicense: () => {
        set({
          licenseKey: null,
          expiresAt: null,
          licenseInfo: null,
          limits: getFeatureLimits(null),
          isActivated: false,
        });
      },

      checkFeature: (feature: keyof FeatureLimits) => {
        const { limits, isActivated } = get();
        if (!isActivated) return false;
        const value = limits[feature];
        return typeof value === 'boolean' ? value : value > 0;
      },
    }),
    {
      name: 'forguncy-insight-license',
      partialize: (state) => ({
        licenseKey: state.licenseKey,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
