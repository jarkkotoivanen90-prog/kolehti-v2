import { motion } from "framer-motion";

const variants = {
  primary: "bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 text-black shadow-[0_0_24px_rgba(80,180,255,0.28)]",
  success: "bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 text-black shadow-[0_0_24px_rgba(60,220,140,0.28)]",
  gold: "bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 text-black shadow-[0_0_24px_rgba(255,180,80,0.28)]",
  ghost: "bg-white/8 border border-white/12 text-white",
};

export default function PremiumButton({ children, onClick, className = "", variant = "primary", type = "button", disabled = false }) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 font-bold transition disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
