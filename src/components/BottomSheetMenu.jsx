import { motion } from "framer-motion";

export default function BottomSheetMenu({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="absolute bottom-0 left-0 right-0 bg-black text-white rounded-t-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 text-lg">
          <div>Profile</div>
          <div>My points</div>
          <div>Settings</div>
          <div>Logout</div>
        </div>
      </motion.div>
    </div>
  );
}
