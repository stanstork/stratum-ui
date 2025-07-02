type CardHeaderProps = {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
};

const CardHeader = ({ title, subtitle, actions }: CardHeaderProps) => (
     <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
    </div>
);

export default CardHeader;