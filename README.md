# Tradex AI Frontend

This is the frontend for Tradex AI, a platform for creating and managing trading strategies. It is built with Next.js and TypeScript, featuring a modern, responsive UI with light and dark modes.

## Features

- **User Authentication**: Secure sign-up, sign-in, and password reset functionality.
- **Google OAuth**: Sign in with your Google account.
- **Session Management**: Robust session handling with automatic token refresh and a 1-hour inactivity timeout.
- **Protected Routes**: Client-side route protection to prevent unauthenticated access.
- **Profile Management**: View and manage user profile information.
- **Subscription System**: Integrated with Stripe for subscription management, including a "Change Plan" modal and a secure checkout form.
- **Dashboard**: A central hub to view and manage trading strategies.
- **Theming**: Supports both light and dark modes.
- **Reusable Components**: A well-organized component library built with Shadcn/ui.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Payments**: [Stripe](https://stripe.com/)
- **State Management**: [React Query](https://tanstack.com/query/v4) for server state and React Hooks for UI state.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd tradexfront
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables:

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

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Contains all the application routes, following the Next.js App Router structure.
- `src/components`: Contains reusable UI components, including common elements, modals, and UI primitives from Shadcn.
- `src/lib`: Core utilities, authentication logic (`auth.ts`), API endpoint definitions (`endpoints.ts`), and the custom fetch wrapper (`fetchWithAutoRefresh.ts`).
- `src/services`: API service layers and React Query mutations.
- `public`: Static assets like images and icons.

## Authentication

Authentication is handled by NextAuth.js with a JWT session strategy.

- **`withAuth` HOC**: A Higher-Order Component located at `src/components/withAuth.tsx` is used to protect client-side routes. It verifies the session on load and handles inactivity timeouts.
- **`fetchWithAutoRefresh`**: A custom fetch wrapper at `src/lib/fetchWithAutoRefresh.ts` automatically attaches the access token to requests and handles token refresh logic when a `401` error is encountered.
