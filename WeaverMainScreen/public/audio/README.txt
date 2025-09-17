Place ambient audio files here:
- typewriter.mp3 (soft typewriter keys; slightly louder than music)
- talking.mp3 (low conversational murmur; same as music level)
- biohazard-theme.mp3 (very low, tense ambient music)

Mix guidelines used in App.tsx:
- music (biohazard-theme): 0.06
- typewriter (room): 0.06
- talking (footsteps channel): 0.05

Fallback formats supported: .mp3, .m4a/.mp4, .ogg

These are optional. If absent, the app will start silent and will not error.
