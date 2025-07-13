# Tradex AI Frontend

This is the frontend for Tradex AI, a platform for creating and managing trading strategies. Built with Next.js, TypeScript, and Tailwind CSS, it features a modern, responsive UI with light and dark modes.

---

## Features

-   **User Authentication**: Secure sign-up, sign-in, and password reset with [NextAuth.js](https://next-auth.js.org/).
-   **Google OAuth**: Sign in with your Google account.
-   **Session Management**: Robust session handling with automatic token refresh and inactivity timeout.
-   **Protected Routes**: Client-side and server-side route protection.
-   **Profile Management**: View and manage user profile information.
-   **Subscription System**: Integrated with Stripe for subscription management, including a "Change Plan" modal and secure checkout.
-   **Dashboard**: Central hub to view, favorite, copy, and manage trading strategies.
-   **Strategy Sharing**: Share strategies with other users and manage invitations.
-   **Favorites**: Mark strategies as favorites for quick access.
-   **Templates & Folders**: Organize strategies using templates and folders.
-   **Notifications**: In-app notification system.
-   **Theming**: Supports both light and dark modes.
-   **Reusable Components**: Well-organized component library built with [Shadcn/ui](https://ui.shadcn.com/).
-   **Custom API Layer**: All backend communication handled via a custom fetch wrapper with auto token refresh.

---

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **Payments**: [Stripe](https://stripe.com/)
-   **State Management**: React Query for server state, React Hooks for UI state.

---

## Project Structure

-   `src/app`: All application routes, following the Next.js App Router structure.
    -   `dashboard/`: Main dashboard and strategy management.
    -   `favorites/`: Favorite strategies.
    -   `folders/`: Folder management.
    -   `notification/`: Notification center.
    -   `profile/`: User profile.
    -   `strategies/`: Strategy details and editing.
    -   `auth/`: Authentication pages.
    -   `shared/`: Strategies shared with the user.
    -   `api/`: API route handlers (if any).
-   `src/components`: Reusable UI components, including cards, modals, and Shadcn primitives.
-   `src/context`: React context providers.
-   `src/hooks`: Custom React hooks.
-   `src/icons`: SVG and icon components.
-   `src/lib`: Core utilities, authentication logic (`auth.ts`), API endpoint definitions (`endpoints.ts`), and the custom fetch wrapper (`fetchWithAutoRefresh.ts`).
-   `src/services`: API service layers and React Query mutations.
-   `src/styles`: Global and utility CSS.
-   `types/`: TypeScript type definitions.
-   `public/`: Static assets like images and icons.

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd tradexfront
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET= # Generate a secret: openssl rand -hex 32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Backend API
NEXT_PUBLIC_API_URL=http://your-backend-api-url.com/api

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

## Authentication

Authentication is handled by NextAuth.js with a JWT session strategy.

-   **`withAuth` HOC**: Located at `src/components/withAuth.tsx`, used to protect client-side routes.
-   **`fetchWithAutoRefresh`**: Located at `src/lib/fetchWithAutoRefresh.ts`, automatically attaches the access token to requests and handles token refresh logic when a `401` error is encountered.

---

## API Layer

All API calls are made through service functions in `src/services/strategy/strategy_API.ts` and related files.  
A custom fetch wrapper (`fetchWithAutoRefresh.ts`) ensures tokens are refreshed automatically.

---

## UI & Theming

-   Uses [Tailwind CSS](https://tailwindcss.com/) for styling.
-   Supports both light and dark modes.
-   UI components are built with [Shadcn/ui](https://ui.shadcn.com/).

---

## Contributions

Feel free to open issues or submit pull requests for improvements and bug fixes.

---

## License

[MIT](LICENSE)