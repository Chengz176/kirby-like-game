import { useState } from "react";

export default function Button({
    onClick: handleClick,
    text,
}: {
    onClick: () => void;
    text: string;
}) {
    const [isHover, setIsHover] = useState<boolean>(false);
    return (
        <div className="input-container">
            {isHover ? (
                <div className="sprite-img kirb-img" style={{ left: 10 }} />
            ) : null}
            <button
                className="btn"
                style={{
                    width: "100%",
                    backgroundColor: isHover ? "crimson" : "",
                    textShadow: "1px 1px black",
                    pointerEvents: 'visible',
                }}
                onClick={handleClick}
                onPointerEnter={(e) => {
                    e.preventDefault();
                    setIsHover(true);
                }}
                onPointerLeave={(e) => {
                    e.preventDefault();
                    setIsHover(false);
                }}
            >
                <strong>{text}</strong>
            </button>
        </div>
    );
}
