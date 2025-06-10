
export const containerVariants = {
  collapsed: {
    height: 68,
    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
  expanded: {
    height: 180, // Will be overridden dynamically
    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
};
