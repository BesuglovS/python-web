'use strict';

/**
 * Application constants
 * Centralized location for all magic numbers and configuration values
 */

/** Maximum length for localStorage values */
export const MAX_STORAGE_VALUE_LENGTH = 102400;

/** Maximum length for user input sanitization */
export const MAX_INPUT_LENGTH = 102400;

/** Maximum sandbox code length (64KB) */
export const MAX_SANDBOX_CODE_LENGTH = 65536;

/** Default sandbox execution timeout in seconds */
export const DEFAULT_SANDBOX_TIMEOUT = 5;

/** Extra timeout buffer for sandbox requests in ms */
export const SANDBOX_TIMEOUT_BUFFER_MS = 2000;

/** Maximum number of errors to track in memory */
export const MAX_TRACKED_ERRORS = 50;

/** Maximum number of REPL history entries */
export const MAX_REPL_HISTORY = 100;

/** Number of REPL history entries to persist */
export const PERSISTED_REPL_HISTORY = 50;

/** Scroll threshold for showing back-to-top button */
export const BACK_TO_TOP_THRESHOLD = 400;

/** Debounce delay for scroll handler in ms */
export const SCROLL_DEBOUNCE_MS = 50;

/** MutationObserver timeout for contest link injection in ms */
export const CONTEST_OBSERVER_TIMEOUT_MS = 10000;

/** hljs retry delay for syntax highlighting in ms */
export const HLJS_RETRY_DELAY_MS = 500;
export const HLJS_RETRY_DELAY_2_MS = 1500;

/** Number of lessons required for "speedrun" badge */
export const SPEEDRUN_LESSONS_COUNT = 3;

/** Number of lessons for "halfway" badge */
export const HALFWAY_LESSONS_COUNT = 25;

/** Number of REPL runs for "repl_10" badge */
export const REPL_EXPERIMENTER_RUNS = 10;

/** Minimum final test score for "quiz_champion" badge */
export const QUIZ_CHAMPION_SCORE = 90;

/** Minimum final test score for "quiz_perfect" badge */
export const QUIZ_PERFECT_SCORE = 100;

/** Minimum streak days for "streak_7" badge */
export const STREAK_DAYS = 7;

/** Total number of lessons in the course */
export const TOTAL_LESSONS = 50;