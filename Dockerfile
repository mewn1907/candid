# ©️ Mewn — Candid production image.
#
# Builds the client (static files -> /app/client/dist, serve with any
# static host or CDN) and runs the signaling server on $PORT (default 8080).
# Configure via environment; see server/.env.example and client/.env.example.
# The client must be built with VITE_API_URL pointing at this server's
# public URL, e.g.:
#   docker build --build-arg VITE_API_URL=https://signal.example.com -t candid .
#   docker run -e CORS_ORIGIN=https://app.example.com -p 8080:8080 candid

FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server
COPY --from=server-build /app/server/package.json /app/server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/src ./src
COPY --from=client-build /app/client/dist /app/client/dist
EXPOSE 8080
CMD ["npm", "start"]
