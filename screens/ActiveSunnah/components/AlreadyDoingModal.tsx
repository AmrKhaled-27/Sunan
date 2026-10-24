import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface AlreadyDoingModalProps {
  visible: boolean;
  routineTitle?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AlreadyDoingModal({
  visible,
  routineTitle,
  onConfirm,
  onClose,
}: AlreadyDoingModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="هل أنت متأكد؟"
      description={`هذا يعني أنك تفعل جميع سنن روتين «${routineTitle}» بانتظام. ستُضاف السنن المتبقية لإنجازاتك وتنتقل مباشرةً للروتين التالي.`}
      confirmText="نعم، أفعلها باستمرار"
      cancelText="رجوع"
      confirmColor={palette.oliveGreen}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
