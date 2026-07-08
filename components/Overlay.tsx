"use client";

import { AnimatePresence, motion } from "framer-motion";

interface OverlayProps {
  visible: boolean;
  children: React.ReactNode;
}

/**
 * Reward content (image or video) shown inside the camera zone as a picture-in-picture
 * card, rather than covering the whole screen, so the person can still be seen doing the
 * gesture while it's up. Must be rendered inside a `relative` positioned ancestor (the
 * camera frame). Content itself is gesture-agnostic — pass whatever should be shown.
 */
export function Overlay({ visible, children }: OverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-3 right-3 z-20 max-w-[45%]"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
