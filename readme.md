# Kiddo Assignment – Server-Driven UI (SDUI) Engine

## Overview

This project is a production-inspired implementation of a **Server-Driven UI (SDUI)** architecture for Kiddo, a quick-commerce platform focused on kids and baby essentials.

Instead of hardcoding screens, the application dynamically renders the homepage from a server-configured JSON payload. The UI engine is built to be resilient, scalable, and easily extensible, allowing marketing campaigns, themes, and layouts to change without requiring a new app release.

---

## Features

* Dynamic UI rendering from JSON configuration
* Component Registry implementing the Factory Pattern
* Graceful handling of unknown component types
* High-performance vertical feed with nested horizontal collections
* Centralized Action Dispatcher
* Runtime theme injection using React Context
* Live campaign support with configurable overlays
* Strict TypeScript architecture
* Optimized rendering using React.memo
* FlashList/FlatList virtualization
* Modular and scalable folder structure

---

## Component Types

The renderer currently supports:

* **BANNER_HERO**

  * Full-width promotional banners

* **PRODUCT_GRID_2X2**

  * Responsive two-column product grid

* **DYNAMIC_COLLECTION**

  * Horizontally scrollable product collections

* **FULL_SCREEN_OVERLAY**

  * Campaign animations rendered above the UI without blocking interactions (`pointerEvents="none"`)

Unknown component types are ignored safely to ensure application stability.

---

## Live Campaign Engine

The application demonstrates runtime campaign switching without requiring an application update.

Supported campaigns include:

* Back to School
* Summer Playhouse
* Mystery Gift Carnival

Each campaign can dynamically provide:

* Theme colors
* Overlay animations
* Promotional collections
* Campaign-specific actions

---

## Runtime Theming

Theme configuration is received through the payload and injected globally using React Context.

Example:

```json
{
  "theme": {
    "primary": "#FF9800",
    "background": "#FFF5E6"
  }
}
```

Every UI component automatically adapts to the active theme.

---

## Universal Action Dispatcher

All user interactions are handled through a centralized dispatcher.

Example:

```json
{
  "action": {
    "type": "ADD_TO_CART",
    "payload": {
      "id": "123"
    }
  }
}
```

Supported action categories include:

* ADD_TO_CART
* DEEP_LINK
* APPLY_MYSTERY_GIFT_COUPON
* Navigation actions
* Wishlist actions
* UI actions

This keeps presentation components completely decoupled from business logic.

---

## Performance Optimizations

* React.memo for component isolation
* Stable keyExtractor implementation
* Optimized nested FlatList/FlashList virtualization
* Local state collocation to prevent unnecessary re-renders
* Context-based runtime theming
* Lightweight component registry lookup
* Defensive rendering for invalid payloads

---

## Tech Stack

* React Native
* Expo
* TypeScript (Strict Mode)
* Expo Router
* React Context API
* FlashList / FlatList
* Lottie Animations
* React Native Reanimated

---

## Project Structure

```
src/
├── actions/
├── components/
├── context/
├── hooks/
├── mock/
├── registry/
├── renderer/
├── screens/
├── services/
├── store/
├── theme/
├── types/
└── utils/
```

---

## Running the Project

Install dependencies

```bash
npm install
```

Start the development server

```bash
npx expo start
```

Run on Android

```bash
Press a
```

or launch the application using Expo Go after scanning the QR code.

---

## Design Principles

* Server-Driven UI
* Factory Pattern
* Component Registry
* Separation of Concerns
* Runtime Configuration
* Fault Tolerance
* Performance-First Rendering
* Scalable Architecture

---

## Future Improvements

* Remote API integration
* OTA campaign updates
* Analytics event pipeline
* Offline payload caching
* Skeleton loading states
* Image prefetching
* A/B testing support
* Feature flag management
* Remote configuration service

---

## Author

**Lakshya Mudgal**
