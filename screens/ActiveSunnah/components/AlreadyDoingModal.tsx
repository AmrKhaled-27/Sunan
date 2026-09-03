import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface AlreadyDoingModalProps {
  visible: boolean;
  sunnahTitle?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AlreadyDoingModal({
  visible,
  sunnahTitle,
  onConfirm,
  onClose,
}: AlreadyDoingModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="هل أنت متأكد؟"
      description={`هذا يعني أنك تفعل «${sunnahTitle}» بانتظام في حياتك، وستنتقل مباشرةً للسنة التالية.`}
      confirmText="نعم، أفعلها باستمرار"
      cancelText="رجوع"
      confirmColor={palette.oliveGreen}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
