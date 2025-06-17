const Icon: React.FC<React.SVGProps<SVGSVGElement>> = ({ children, className = "w-6 h-6", path }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d={path} /></svg>
    );
}

export const SunIcon = () =>
    <Icon path="M12 2c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 5c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z" className="w-6 h-6" />;

export const MoonIcon = () => <Icon path="M12 2.062C6.513 2.062 2.062 6.513 2.062 12c0 5.487 4.451 9.938 9.938 9.938 2.031 0 3.92-.615 5.51-1.693-1.764-.78-3.235-2.25-3.99-4.004-1.258-2.926-.26-6.42 2.666-7.678-.59-.047-1.18-.063-1.772-.063z" className="w-6 h-6" />;
export const ClockIcon = () => <Icon path="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm4.293 6.707l-1.414-1.414L13 13.586V8h-2v6.414l3.707 3.707 1.414-1.414z" className="h-6 w-6 text-white" />;
export const CheckCircleIcon = () => <Icon path="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM10.707 14.707l4.586-4.586-1.414-1.414-3.172 3.172-1.414-1.414-1.414 1.414 2.828 2.828z" className="h-6 w-6 text-white" />;
export const LoaderIcon = () => <svg className="h-6 w-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
export const FileTextIcon = () => <Icon path="M6 2c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2V8l-6-6H6zm-1 2h4v5h5v11H5V4zm7-1.414L16.586 9H12V2.586z" className="h-6 w-6 text-white" />;