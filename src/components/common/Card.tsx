const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
    return (
        <div
            className={`bg-white/60 dark:bg-gray-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-gray-900/5 rounded-2xl overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
export default Card;