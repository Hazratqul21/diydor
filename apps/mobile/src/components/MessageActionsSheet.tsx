import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';
import { useScrollLock } from '@/lib/useScrollLock';
import type { Message } from '@/lib/data';

export function MessageActionsSheet({
  message,
  open,
  onClose,
  onEdit,
  onDelete,
  onReply,
}: {
  message: Message | null;
  open: boolean;
  onClose: () => void;
  onEdit: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onReply: (msg: Message) => void;
}) {
  useScrollLock(open);

  if (!message) return null;

  const isMine = message.senderId === localStorage.getItem('userId'); // Yoki `getUserId()`
  const isText = message.type === 'TEXT';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end max-w-[480px] mx-auto"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface rounded-t-[28px] p-4 pb-safe-bottom"
          >
            <div className="w-12 h-1.5 bg-on-surface-variant/30 rounded-full mx-auto mb-4" />

            <div className="flex flex-col">
              <button
                onClick={() => {
                  onReply(message);
                  onClose();
                }}
                className="w-full h-[52px] flex items-center gap-3 px-2 text-left text-body-md text-on-surface press"
              >
                <Icon name="reply" className="text-[22px] text-on-surface-variant" /> Javob berish
              </button>
              
              {isMine && isText && (
                <button
                  onClick={() => {
                    onEdit(message);
                    onClose();
                  }}
                  className="w-full h-[52px] flex items-center gap-3 px-2 text-left text-body-md text-on-surface press"
                >
                  <Icon name="edit" className="text-[22px] text-on-surface-variant" /> Tahrirlash
                </button>
              )}

              {isMine && (
                <button
                  onClick={() => {
                    onDelete(message);
                    onClose();
                  }}
                  className="w-full h-[52px] flex items-center gap-3 px-2 text-left text-body-md text-error press"
                >
                  <Icon name="delete" className="text-[22px]" /> O'chirish
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full h-[52px] mt-1 rounded-xl bg-surface-container text-body-md font-medium text-on-surface press"
              >
                Bekor qilish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
