// Native audio isn't available under Jest: stand in with silent players.
jest.mock('expo-audio', () => {
  const player = () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(), loop: false, volume: 1 });
  return {
    createAudioPlayer: jest.fn(player),
    setAudioModeAsync: jest.fn(async () => {}),
  };
});
