import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface SkipModalProps {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function SkipModal({ visible, onConfirm, onClose }: SkipModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="تأجيل هذا الروتين؟"
      description="سيُصفّر عدّاد الأيام لهذا الروتين وينتقل إلى الروتين التالي. نعود للروتينات المؤجلة بعد البقية. إذا كان هذا آخر روتين متبقٍ فسيبقى نشطاً ويبدأ عدّاده من جديد."
      confirmText="نعم، تخطي"
      cancelText="رجوع"
      confirmColor={palette.warmBrownSubtle}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
