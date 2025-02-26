FROM node:20

# Add this line to suppress funding messages
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

# Install tsx globally
RUN npm install -g tsx

# Copy the rest of the application code
COPY . .

# Set permissions
RUN chmod -R 755 scripts/
RUN chmod -R 755 node_modules/.bin/

# Expose ports for the frontend and backend
EXPOSE 5005 5174

CMD ["npm", "run", "dev"]
