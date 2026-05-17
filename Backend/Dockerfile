FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    libonig-dev \
    libpq-dev \
    && docker-php-ext-install pdo pdo_mysql zip

# Enable Apache Rewrite module
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy composer files and install dependencies
COPY composer.json composer.lock ./
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php
RUN composer install --no-interaction --prefer-dist --no-dev

# Copy application source
COPY . .

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port 8000 (Symfony built‑in server will listen on this port)
EXPOSE 8000

# Default command – Symfony server will be started from docker‑compose
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
