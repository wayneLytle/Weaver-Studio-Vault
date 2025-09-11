
import React, { useEffect, useState } from 'react';

interface MainScreenProps {
    username: string;
}

const MainScreen: React.FC<MainScreenProps> = ({ username }) => {
    const [showBanner, setShowBanner] = useState(true);
    const [fadeBanner, setFadeBanner] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeBanner(true);
            setTimeout(() => setShowBanner(false), 1000); // 1s fade duration
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="w-full h-full flex items-center justify-center p-8 relative"
            style={{
                backgroundImage: `url('/assets/backgrounds/Mainarea BG.005Z.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {showBanner && (
                <div
                    className={`text-center w-full transition-opacity duration-1000 ${fadeBanner ? 'opacity-0' : 'opacity-100'}`}
                >
                    <h1 className="text-5xl md:text-7xl text-[#E0C87A] font-['Playfair_Display_SC',_serif] italic" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.8)'}}>
                        Welcome, {username}
                    </h1>
                    <p className="text-xl md:text-2xl text-[#E0C87A]/80 font-['Playfair_Display_SC',_serif] italic mt-4" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
                        The vault is yours to explore.
                    </p>
                </div>
            )}
            {/* ...existing content... */}
        </div>
    );
};

export default MainScreen;
