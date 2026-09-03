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
      title="تخطي هذه السنة؟"
      description="ستنتقل للسنة التالية. يمكنك العودة إليها لاحقاً من قائمة السنن."
      confirmText="نعم، تخطي"
      cancelText="رجوع"
      confirmColor={palette.warmBrownSubtle}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
