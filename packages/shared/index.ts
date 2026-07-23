export type {
  ApiError,
  PaginatedResponse,
  CategoryResponse,
  UserResponse,
  AuthUserResponse,
  AuthSessionResponse,
  OAuthUrlResponse,
  MagicLinkResponse,
  ProductResponse,
  CreateProductInput,
  VoteResponse,
  CommentResponse,
  ProfileResponse,
} from "./lib/types";
export { CATEGORIES } from "./lib/constants";
export type { CategorySlug } from "./lib/constants";
export type { WeekRange } from "./lib/week";
export {
  getWeekRange,
  getIsoWeeksInYear,
  getCurrentIsoWeek,
  getWeekRangeFromIsoWeek,
  resolveWeekRange,
  getPrevWeek,
  getNextWeek,
  formatWeekLabel,
  isCurrentWeek,
} from "./lib/week";
