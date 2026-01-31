import './StarBorder.css';

const StarBorder = ({
    as: Component = "button",
    className = "",
    color = "#a855f7",
    speed = "4s",
    children,
    ...props
}) => {
    return (
        <Component className={`star-border-container ${className}`} {...props}>
            <div
                className="border-gradient-bottom"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed
                }}
            ></div>
            <div
                className="border-gradient-top"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed
                }}
            ></div>
            <div className="inner-content">{children}</div>
        </Component>
    );
};

export default StarBorder;
