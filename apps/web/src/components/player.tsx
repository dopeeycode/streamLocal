import { PlayerSimple } from './player-simple';

export function Player({ mediaId }: { mediaId: string }) {
  return <PlayerSimple mediaId={mediaId} />;
}

export default Player;