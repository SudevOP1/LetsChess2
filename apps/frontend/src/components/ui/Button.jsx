import Loader from "./Loader";

const Button = ({ children, variant = "primary", size = "md", isLoading = false, className = "", ...props }) => {
  const baseStyles = `inline-flex items-center justify-center font-medium
    disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer`;

  const variants = {
    primary:
      "bg-primary text-background hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled disabled:text-white",
    secondary: "bg-surface text-white hover:bg-surface-hover active:bg-surface-active disabled:bg-disabled disabled:text-white",
    outline:
      "bg-none hover:bg-surface-hover active:bg-surface-active disabled:bg-disabled text-white border border-surface-hover active:border-surface-active",
    ghost: "bg-none hover:bg-surface-hover active:bg-surface-active disabled:bg-disabled text-white",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader size={size} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
