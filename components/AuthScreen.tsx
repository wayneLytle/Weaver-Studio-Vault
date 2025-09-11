
import React from 'react';
import './AuthScreen.css';
// Reusable component for the ornate, steampunk-style frame.
interface OrnateFrameProps {
    children: React.ReactNode;
    className?: string;
}

const OrnateFrame: React.FC<OrnateFrameProps> = ({ children, className = '' }) => {
    return (
        <div
            className={`bg-[#10141B]/80 p-[6px] shadow-2xl rounded-xl border-4 border-[#E0C87A] ${className}`}
            style={{
                border: '4px solid #E0C87A',
                borderRadius: '18px',
                boxShadow: '0 0 22px 6px rgba(234, 206, 120, 0.14), 0 0 0 6px rgba(72,56,34,0.18), inset 0 0 12px rgba(234,206,120,0.18)',
                position: 'relative',
                background: 'repeating-linear-gradient(135deg, #1f242b 0px, #10141B 12px, #5b4a2f 14px, #1f242b 16px)',
            }}
        >
            {/* OrnateFrame border (decorative circles removed) */}
            <div className="bg-gradient-to-b from-[#1f242b] to-[#10141B] p-[6px] rounded-lg border-2 border-[#E0C87A]">{children}</div>
        </div>
    );
};

interface AuthScreenProps {
    onLogin: (username: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [transitioning, setTransitioning] = React.useState(false);

    const sharedButtonClasses = "w-full text-center text-[1.5rem] md:text-[2.25rem] text-[#E0C87A] font-['Playfair_Display_SC',_serif] italic py-2 px-6 cursor-pointer tracking-widest select-none transition-opacity border-2 border-[#E0C87A] rounded-lg shadow-lg";
    const sharedInputClasses = "w-full bg-transparent text-center text-[1.5rem] md:text-[2.25rem] text-[#E0C87A] font-['Playfair_Display_SC',_serif] italic py-2 px-6 outline-none placeholder-[#E0C87A]/50 border-2 border-[#E0C87A] rounded-lg shadow-lg";

    return (
        <main className="vault-bg relative w-full h-full flex items-center justify-center" style={{ fontSize: '1.25rem' }} aria-label="Vault Door Background">
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Background layers for crossfade */}
                <div
                    className="auth-bg-layer"
                    style={{
                        // Use the canonical baseline background expected by the visual spec,
                        // but fall back to an existing shipped image if the file is missing on disk.
                        backgroundImage: `url('/assets/backgrounds/AuthScreenBG.png'), url('/assets/backgrounds/vault2.361Z.png')`,
                        opacity: transitioning ? 0 : 1,
                        transition: 'opacity 1.2s ease',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 0,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <div
                    className="auth-bg-layer"
                    style={{
                        backgroundImage: `url('/assets/backgrounds/Mainarea BG.005Z.png')`,
                        opacity: transitioning ? 1 : 0,
                        transition: 'opacity 1.2s ease',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 0,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />

                {/* content overlays */}
                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <div className="light-overlay left" aria-hidden="true" />
                    <div className="light-overlay right" aria-hidden="true" />

                    {/* Header banner and login/sign-up UI removed per request */}

                    {/* About/Help buttons removed per cleanup request */}
                </div>
            </div>
        </main>
    );
};

export default AuthScreen;
