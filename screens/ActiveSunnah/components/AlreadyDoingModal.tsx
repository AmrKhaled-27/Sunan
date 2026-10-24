import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface AlreadyDoingModalProps {
  visible: boolean;
  embedded?: boolean;
  routineTitle?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AlreadyDoingModal({
  visible,
  embedded,
  routineTitle,
  onConfirm,
  onClose,
}: AlreadyDoingModalProps) {
  return (
    <ConfirmModal
      embedded={embedded}
      visible={visible}
      title="أصبحت هذه السنن عادة؟"
      description={`ستُضاف جميع السنن المتبقية في «${routineTitle}» إلى إنجازاتك فوراً، وتنتقل إلى المجموعة التالية دون انتظار سبعة أيام.`}
      confirmText="نعم، أفعلها باستمرار"
      cancelText="رجوع"
      confirmColor={palette.oliveGreen}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
