-- KinderLab Robotics Database Schema
-- SQLite Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT ''
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('received', 'preparing', 'shipping', 'delivered')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address TEXT NOT NULL, -- JSON string
    created_at TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_provider TEXT,
    payment_reference TEXT,
    payment_amount REAL NOT NULL DEFAULT 0,
    payment_currency TEXT NOT NULL DEFAULT 'USD',
    payment_failed_reason TEXT,
    paid_at TEXT,
    shipment_provider TEXT,
    shipment_tracking_number TEXT,
    fulfillment_source TEXT NOT NULL DEFAULT 'manual' CHECK (fulfillment_source IN ('manual', 'carrier', 'manual-override')),
    fulfillment_updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Payment Attempts Table
CREATE TABLE IF NOT EXISTS payment_attempts (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_reference TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'cancelled')),
    failure_reason TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Payment Webhook/Event Log Table
CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    order_id TEXT,
    payload TEXT NOT NULL,
    processed_at TEXT NOT NULL,
    UNIQUE(provider, provider_event_id),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fulfillment_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('admin-manual', 'carrier-webhook', 'manual-override')),
    from_status TEXT CHECK (from_status IN ('received', 'preparing', 'shipping', 'delivered')),
    to_status TEXT NOT NULL CHECK (to_status IN ('received', 'preparing', 'shipping', 'delivered')),
    shipment_provider TEXT,
    shipment_tracking_number TEXT,
    provider_event_id TEXT,
    reason TEXT,
    actor_user_id TEXT,
    actor_email TEXT,
    payload TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    UNIQUE(shipment_provider, provider_event_id),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_order_id ON fulfillment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_source ON fulfillment_events(source);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_provider_event ON fulfillment_events(shipment_provider, provider_event_id);

-- Course Registrations Table
CREATE TABLE IF NOT EXISTS course_registrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    registration_data TEXT NOT NULL, -- JSON string
    status TEXT NOT NULL CHECK (status IN ('registered', 'active', 'completed')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_zip_code TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    billing_city TEXT NOT NULL,
    billing_state TEXT NOT NULL,
    billing_zip_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('general', 'support', 'training', 'sales')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'reviewing', 'answered', 'closed')),
    created_at TEXT NOT NULL
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    author TEXT NOT NULL,
    publish_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    images TEXT NOT NULL DEFAULT '[]', -- JSON string of image objects
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Press Releases Table
CREATE TABLE IF NOT EXISTS press_releases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    author TEXT NOT NULL,
    publish_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    images TEXT NOT NULL DEFAULT '[]', -- JSON string of image objects
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_user_id ON course_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_status ON course_registrations(status);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_created_at ON press_releases(created_at);
CREATE INDEX IF NOT EXISTS idx_press_releases_publish_date ON press_releases(publish_date);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    venue_city TEXT NOT NULL,
    venue_state TEXT NOT NULL,
    venue_zip_code TEXT NOT NULL,
    venue_country TEXT NOT NULL,
    venue_website TEXT,
    google_maps_link TEXT,
    organizer_name TEXT NOT NULL,
    organizer_website TEXT,
    event_website TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    category TEXT NOT NULL DEFAULT 'conference',
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Media Coverage Table
CREATE TABLE IF NOT EXISTS media_coverage (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    source_name TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL,
    publish_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    images TEXT NOT NULL DEFAULT '[]', -- JSON string of image objects
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- User Addresses Table
CREATE TABLE IF NOT EXISTS user_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('delivery', 'billing')),
    is_default INTEGER NOT NULL DEFAULT 0,
    address TEXT NOT NULL,
    apartment TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    province TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Turkey',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User Payment Methods Table
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    card_title TEXT NOT NULL,
    card_last_four TEXT NOT NULL,
    card_type TEXT NOT NULL CHECK (card_type IN ('visa', 'mastercard', 'amex', 'unknown')),
    expiry_month TEXT NOT NULL,
    expiry_year TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create indexes for media coverage table
CREATE INDEX IF NOT EXISTS idx_media_coverage_status ON media_coverage(status);
CREATE INDEX IF NOT EXISTS idx_media_coverage_created_at ON media_coverage(created_at);
CREATE INDEX IF NOT EXISTS idx_media_coverage_publish_date ON media_coverage(publish_date);

-- Create indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Additional indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Additional indexes for user data
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
