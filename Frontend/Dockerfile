FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy the rest of the source code
COPY . .

# Expose React dev server port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
