import React from 'react';

interface MeepleAvatarProps {
    color?: string;
    size?: number;
    className?: string;
}

export const MeepleAvatar: React.FC<MeepleAvatarProps> = ({
    color = '#2C3E50',
    size = 40,
    className = ''
}) => {
    return (
        <div className={className} style={{ width: size, height: size, display: 'inline-block' }}>
            <svg
                viewBox="0 0 512 512"
                fill={color}
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
            >
                {/* Standard Meeple Shape */}
                <path d="M256 64C229.5 64 208 85.5 208 112C208 138.5 229.5 160 256 160C282.5 160 304 138.5 304 112C304 85.5 282.5 64 256 64ZM160 192C133.5 192 112 213.5 112 240V288C112 305.7 126.3 320 144 320H176V416C176 433.7 190.3 448 208 448H224C241.7 448 256 433.7 256 416V368H256V416C256 433.7 270.3 448 288 448H304C321.7 448 336 433.7 336 416V320H368C385.7 320 400 305.7 400 288V240C400 213.5 378.5 192 352 192H160Z" />
            </svg>
        </div>
    );
};
