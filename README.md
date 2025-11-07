check this link https://github.com/sdtmanish/quizhubapi for checking server side code

🕹️ How the Game Works
✅ 1. Admin creates a room
Admin logs in → creates a quiz room.

✅ 2. Players join using room code
Enter name → join lobby → waiting screen.

✅ 3. Admin starts the game
Server broadcasts question in real-time.

✅ 4. Player submits answer
Server validates → scores → updates leaderboard.

✅ 5. Next question started by admin
Smooth transitions & real-time updates.

✅ 6. Game ends
Final leaderboard displayed → admin can review results.

📊 WebSocket Event Flow
Player Events
player:join
player:answer
player:leave

Admin Events
admin:start
admin:next
admin:end

Server → Client Events
question:show
question:lock
leaderboard:update
game:ended
room:snapshot

📦 Future Enhancements
Redis Pub/Sub for horizontal scaling
Advanced analytics dashboard
Public lobbies & matchmaking
AI-based question generation
Game history & player stats

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
