import React from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { palette } from "@/constants/theme";

interface SkipModalProps {
  visible: boolean;
  embedded?: boolean;
  routineTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function SkipModal({
  visible,
  embedded,
  routineTitle,
  onConfirm,
  onClose,
}: SkipModalProps) {
  return (
    <ConfirmModal
      embedded={embedded}
      visible={visible}
      title="تأجيل هذه السنن؟"
      description={`ستُؤجَّل جميع سنن «${routineTitle}» ويُصفَّر عدّاد أيامها. ستعود إليها بعد بقية المجموعات. إذا كانت آخر مجموعة متبقية، فستبقى هنا ويبدأ عدّادها من جديد.`}
      confirmText="تأجيل المجموعة"
      cancelText="رجوع"
      confirmColor={palette.warmBrownSubtle}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
