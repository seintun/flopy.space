export const GRAVITY = -22;
export const FLAP_VELOCITY = 7.5;
export const TERMINAL_VY = -14;
export const GROUND_Y = -6;
export const CEILING_Y = 8;
export const BIRD_X = 0;
export const BIRD_VISUAL_RADIUS = 0.45;
export const HITBOX_RADIUS = 0.3825; // 85% forgiving hitbox
export const PIPE_RADIUS = 0.9;
export const PIPE_SPACING_DIST = 11;
export const GAP_START = 4.5;
export const GAP_MIN = 2.85;
export const GAP_SHRINK_END_SCORE = 40;
export const GAP_WANDER_MAX = 1.5;
export const BASE_SCROLL = 6;
export const SCROLL_RAMP = 0.15;
export const MAX_SCROLL = 12;
export const SCROLL_RAMP_MID = 32;
export const BREATHER_EVERY_PIPES = 15;
export const BREATHER_GAP_HEIGHT = 4.8;
export const BREATHER_PIPE_COUNT = 2;
export const NEAR_MISS_MARGIN = 0.3;
export const COMBO_CAP = 3;
export const COMBO_TIER_2 = 6;
export const COMBO_TIER_3 = 20;
export const FEATHER_EVERY_POINTS = 10;
export const FEATHER_BANK_CAP = 3;
export const REWINDS_MAX_PER_RUN = 3;
export const REWIND_SECONDS = 1.5;
export const DT = 1 / 120;
export const BUFFER_LEN = 180; // 1.5s at 120Hz
export const SLOWMO_SCALE = 0.35;
export const SLOWMO_HOLD_S = 3;
export const SLOWMO_EASE_S = 0.15;
export const ORB_EVERY_PIPES_MIN = 8;
export const ORB_EVERY_PIPES_MAX = 12;
export const MILESTONE_EVERY = 50;
export const SPAWN_X = BIRD_X + 16;
export const PITCH_SMOOTHING = 8;
export const INVULN_TICKS = 120; // 1s post-rewind shimmer
export const DESPAWN_MARGIN = 2;

// Scale Shifter Constants
export const CHIBI_HITBOX_MULT = 0.55;
export const CHIBI_VISUAL_SCALE = 0.45;
export const CHIBI_DURATION = 5.0;

export const CHUBBY_HITBOX_MULT = 1.35;
export const CHUBBY_VISUAL_SCALE = 1.70;
export const CHUBBY_DURATION = 6.0;
export const CHUBBY_EXPANSION_GRACE_TICKS = 60; // 0.5s invulnerability upon picking up Chubby orb

// Kinetic Moving Pipe Constants
export const KINETIC_PIPES_START_SCORE = 10;
export const MAX_PIPE_MOTION_AMP = 1.2;
export const MAX_PIPE_MOTION_FREQ = 2.0;
export const KINETIC_MIN_GAP = 3.1;
