
import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import MainScreen from './components/MainScreen';
import InsertComponentNameHere from './components/InsertComponentNameHere';
// Dev mode runtime UI removed (archival copies were previously stored separately)

// Image URLs for backgrounds - Switched to a different host to resolve loading issues.
const AUTH_BG_URL = '/assets/backgrounds/vault2.361Z.png'; // Steampunk vault door
const MAIN_BG_URL = '/assets/backgrounds/Mainarea BG.005Z.png';  // Steampunk vault interior

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const [username, setUsername] = useState('');
    const [backgroundUrl, setBackgroundUrl] = useState(AUTH_BG_URL);

    // Preload images for a smoother transition
    useEffect(() => {
        const authBg = new window.Image();
        authBg.src = AUTH_BG_URL;
        const mainBg = new window.Image();
        mainBg.src = MAIN_BG_URL;
    }, []);

    const handleLogin = (name: string) => {
        setUsername(name);
        setIsFading(true); // Start fade-out
        setTimeout(() => {
            setIsLoggedIn(true);
            setBackgroundUrl(MAIN_BG_URL); // Switch background image
            // A short delay to allow the new background to load before fading in
            setTimeout(() => {
                setIsFading(false); // Start fade-in
            }, 100);
        }, 1000); // Must match the fade-out duration
    };

    const backgroundStyle: React.CSSProperties = {
        backgroundImage: `url(${backgroundUrl})`,
    };

    return (
        <main
            style={backgroundStyle}
            // Using w-full instead of w-screen to avoid potential layout issues
            className="w-full h-screen bg-cover bg-center bg-no-repeat transition-all duration-1000"
        >
            <div className={`w-full h-full transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {!isLoggedIn ? (
                    <AuthScreen onLogin={handleLogin} />
                ) : (
                    // Mount the manifest-driven scaffold for verification
                    <InsertComponentNameHere
                        manifest={{ title: 'Demo Workspace', subtitle: 'Drop-in scaffold', status: 'Demo' , document: { title: 'Demo Tale' } }}
                        personaOverlays={[{ name: 'Muse', description: 'Creative boost' }, { name: 'Critic', description: 'Analytical feedback' }]}
                        onAction={(id, payload) => console.log('action', id, payload)}
                    />
                    /* To restore previous MainScreen, replace above with:
                    <MainScreen username={username} />
                    */
                )}
            </div>
    </main>
    );
};

export default App;
