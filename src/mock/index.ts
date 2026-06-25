/**
 * src/mock/index.ts
 *
 * Public exports for the mock data layer.
 * Import from here in hooks, tests, and Storybook stories.
 */
export { homepagePayload, ACTIVE_CAMPAIGN_ID, PAGE_NODES, CAMPAIGN_NODES } from './homepagePayload';
export { PRODUCTS, TOYS, ART_SUPPLIES, STATIONERY, APPAREL, OUTDOOR_SPORTS, BACK_TO_SCHOOL_PRODUCTS, SUMMER_PRODUCTS } from './fixtures/products';
export { CAMPAIGN_BACK_TO_SCHOOL, CAMPAIGN_SUMMER_PLAYHOUSE, CAMPAIGN_MYSTERY_GIFT_CARNIVAL, PROMO_BTS_FLAT200, PROMO_SUMMER_25PCT, PROMO_MYSTERY_BXGY, PROMO_FLASH_SALE_40PCT } from './fixtures/campaigns';
export { BACK_TO_SCHOOL_NODES } from './campaigns/backToSchool';
export { SUMMER_PLAYHOUSE_NODES } from './campaigns/summerPlayhouse';
export { MYSTERY_GIFT_CARNIVAL_NODES } from './campaigns/mysteryGiftCarnival';
