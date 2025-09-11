
import React, { useState } from 'react';
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
    const [isFlipped, setIsFlipped] = useState(false);
    const [username, setUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transitioning, setTransitioning] = useState(false);

    const handleLoginClick = () => {
        if (!isFlipped) setIsFlipped(true);
    };

    const handleEnterVault = () => {
        if (username.trim() && !isSubmitting) {
            setIsSubmitting(true);
            setTransitioning(true);
            // wait for crossfade to finish before navigating to main screen
            setTimeout(() => onLogin(username), 1200);
        }
    };

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

                    <header className="vault-logo absolute left-1/2" style={{ top: 0, width: '1200px', maxWidth: '100vw', transform: 'translateX(-50%) scaleY(0.9)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }} role="banner" aria-label="Weaver Studio Vault Logo">
                        <OrnateFrame className="w-full mx-auto">
                            <h1 className="text-[2.25rem] md:text-[3.75rem] text-[#E0C87A] text-center font-['Playfair_Display_SC',_serif] italic py-[5px] tracking-widest" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }} aria-label="Weaver Studio Vault">
                                Weaver Studio Vault
                            </h1>
                        </OrnateFrame>
                    </header>

                    <nav className="vault-buttons absolute" style={{ top: 'calc(960px - 5.5in)', left: 'calc(50% + 864px - 2in)', transform: 'translateX(-50%)', width: '340px', zIndex: 20, display: 'flex', flexDirection: 'row', gap: '192px', justifyContent: 'center' }} role="navigation" aria-label="Login and Sign Up">
                        <div style={{ perspective: '1200px', width: '100%' }}>
                            <div className={`transition-transform duration-1000 w-full ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                                <div className="absolute w-full h-full [backface-visibility:hidden]">
                                    <OrnateFrame>
                                        <button onClick={handleLoginClick} className={sharedButtonClasses + ' py-[13px]'} aria-label="LOGIN">
                                            LOGIN
                                        </button>
                                    </OrnateFrame>
                                </div>
                                <div className="w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                    <OrnateFrame>
                                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ENTER NAME" className={sharedInputClasses + ' py-[13px]'} onKeyPress={(e) => e.key === 'Enter' && handleEnterVault()} autoFocus aria-label="Enter Name" />
                                    </OrnateFrame>
                                </div>
                            </div>

                            <div className={`transition-transform duration-1000 w-full mt-4 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                                <div className="absolute w-full h-full [backface-visibility:hidden]">
                                    <OrnateFrame>
                                        <button className={`${sharedButtonClasses} py-[13px] opacity-60 cursor-not-allowed`} aria-label="Sign Up" disabled>
                                            SIGN UP
                                        </button>
                                    </OrnateFrame>
                                </div>
                                <div className="w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                    <OrnateFrame>
                                        <button onClick={handleEnterVault} disabled={!username.trim() || isSubmitting} className={`${sharedButtonClasses} py-[13px] disabled:opacity-60 disabled:cursor-not-allowed`} aria-label="ENTER">
                                            ENTER VAULT
                                        </button>
                                    </OrnateFrame>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <nav className="vault-buttons-secondary absolute" style={{ left: '0', bottom: '32px', zIndex: 20, display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'flex-start' }} role="navigation" aria-label="About and Help">
                        <div style={{ padding: '20px', background: 'rgba(16,20,27,0.7)', borderRadius: '12px', transform: 'scale(0.75)' }}>
                            <button className={sharedButtonClasses + ' text-base'} style={{ padding: '20px', minWidth: '80px' }} aria-label="About">ABOUT</button>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(16,20,27,0.7)', borderRadius: '12px', transform: 'scale(0.75)' }}>
                            <button className={sharedButtonClasses + ' text-base'} style={{ padding: '20px', minWidth: '80px' }} aria-label="Help">HELP</button>
                        </div>
                    </nav>
                </div>
            </div>
        </main>
    );
};

export default AuthScreen;
