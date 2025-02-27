FROM node:20

# Suppress unnecessary messages
ENV DISABLE_OPENCOLLECTIVE=true
ENV ADBLOCK=true

# Set npm to run in production mode and suppress warnings
RUN npm config set fund false
RUN npm config set loglevel error

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm install cors

# Install tsx globally
RUN npm install -g tsx

# Compile TypeScript files
#RUN npx tsc

# Install specific dependencies (e.g., @tanstack/react-query)
RUN npm install @tanstack/react-query @tanstack/react-query-devtools @types/express

# Copy the rest of the application code
COPY . .

# Set permissions
RUN chmod -R 755 scripts/
RUN chmod -R 755 node_modules/.bin/

# Expose ports for the frontend and backend
EXPOSE 5005 5174

CMD ["npm", "run", "dev"]
