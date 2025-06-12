const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
    return (
        <div
            className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
export default Card;