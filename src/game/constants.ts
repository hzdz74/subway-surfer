export const LANE_X = [-2.2, 0, 2.2] as const;
export type Lane = 0 | 1 | 2;

export const PLAYER_BASE_HEIGHT = 1.0;
export const PLAYER_SLIDE_HEIGHT = 0.45;
export const PLAYER_WIDTH = 0.9;

export const GRAVITY = 32;
export const JUMP_VELOCITY = 12;
export const SLIDE_DURATION = 0.75;

export const LANE_SWITCH_DURATION = 0.13;

export const START_SPEED = 14;
export const MAX_SPEED = 42;
export const SPEED_RAMP = 0.5; // units per second added each second (linear)

export const TRACK_SEGMENT_LENGTH = 30;
export const TRACK_SEGMENT_COUNT = 8;
export const SPAWN_DISTANCE_AHEAD = 160;
export const DESPAWN_DISTANCE_BEHIND = 20;

export const COIN_VALUE = 1;

export const STORAGE_KEY = 'dino-runner-v1';
