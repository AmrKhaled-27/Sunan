import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface ResetModalProps {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResetModal({ visible, onConfirm, onClose }: ResetModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="إعادة ضبط البيانات؟"
      description="سيتم مسح جميع الإحصائيات، السلاسل، والسنن المكتملة، والبدء من جديد من أول سنة."
      confirmText="نعم، امسح وابدأ من جديد"
      cancelText="إلغاء"
      confirmColor={palette.danger}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
