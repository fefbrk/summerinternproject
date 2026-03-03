const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Veritabanı dosya yolu
const resolveDatabasePath = () => {
    const configuredPath = typeof process.env.SQLITE_DB_PATH === 'string'
        ? process.env.SQLITE_DB_PATH.trim()
        : '';

    if (configuredPath) {
        return path.resolve(configuredPath);
    }

    return path.join(__dirname, 'kinderlab.db');
};

const DB_PATH = resolveDatabasePath();
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

class Database {
    constructor() {
        this.db = null;
    }

    safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (_error) {
            return fallback;
        }
    }

    normalizeOrderItems(rawItems) {
        if (!Array.isArray(rawItems)) {
            return [];
        }

        return rawItems
            .map((item) => {
                if (!item || typeof item !== 'object') {
                    return null;
                }

                const itemId = String(item.id || item.productId || item.product_id || '').trim();
                const itemName = String(item.name || item.productName || item.product_name || '').trim();
                const quantity = Number(item.quantity);
                const price = Number(item.price);

                if (!itemId || !itemName || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) {
                    return null;
                }

                return {
                    id: itemId,
                    name: itemName,
                    quantity,
                    price,
                    image: typeof item.image === 'string' ? item.image : ''
                };
            })
            .filter(Boolean);
    }

    normalizeOrderRow(order) {
        if (!order) {
            return order;
        }

        const parsedItems = order.items ? this.safeJsonParse(order.items, []) : [];
        const parsedPaymentAmount = Number(order.paymentAmount);
        return {
            ...order,
            paymentStatus: typeof order.paymentStatus === 'string' ? order.paymentStatus : 'pending',
            paymentProvider: typeof order.paymentProvider === 'string' ? order.paymentProvider : null,
            paymentReference: typeof order.paymentReference === 'string' ? order.paymentReference : null,
            paymentAmount: Number.isFinite(parsedPaymentAmount) ? parsedPaymentAmount : Number(order.totalAmount || 0),
            paymentCurrency: typeof order.paymentCurrency === 'string' && order.paymentCurrency.trim().length > 0 ? order.paymentCurrency : 'USD',
            paymentFailedReason: typeof order.paymentFailedReason === 'string' ? order.paymentFailedReason : null,
            paidAt: typeof order.paidAt === 'string' ? order.paidAt : null,
            shipmentProvider: typeof order.shipmentProvider === 'string' ? order.shipmentProvider : null,
            shipmentTrackingNumber: typeof order.shipmentTrackingNumber === 'string' ? order.shipmentTrackingNumber : null,
            fulfillmentSource: typeof order.fulfillmentSource === 'string' ? order.fulfillmentSource : 'manual',
            fulfillmentUpdatedAt: typeof order.fulfillmentUpdatedAt === 'string' ? order.fulfillmentUpdatedAt : null,
            shippingAddress: order.shippingAddress ? this.safeJsonParse(order.shippingAddress, {}) : {},
            items: this.normalizeOrderItems(parsedItems)
        };
    }

    // Veritabanına bağlan
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Veritabanı bağlantı hatası:', err);
                    reject(err);
                } else {
                    this.db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
                        if (pragmaErr) {
                            console.error('PRAGMA foreign_keys ayarlama hatası:', pragmaErr);
                            reject(pragmaErr);
                            return;
                        }

                        this.db.run('PRAGMA journal_mode = WAL', (walErr) => {
                            if (walErr) {
                                console.warn('PRAGMA journal_mode = WAL ayarlama hatası:', walErr);
                            }
                            console.log('SQLite veritabanına bağlandı');
                            resolve();
                        });
                    });
                }
            });
        });
    }

    // Veritabanını kapat
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Veritabanı kapatma hatası:', err);
                        reject(err);
                    } else {
                        console.log('Veritabanı bağlantısı kapatıldı');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Şema dosyasını çalıştır
    async runSchema() {
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');

            return new Promise((resolve, reject) => {
                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Şema çalıştırma hatası:', err);
                        reject(err);
                    } else {
                        console.log('Veritabanı şeması başarıyla çalıştırıldı');
                        this.runMigrations().then(resolve).catch(reject);
                    }
                });
            });
        } catch (error) {
            console.error('Şema dosyası okuma hatası:', error);
            throw error;
        }
    }

    // Veritabanı migrasyonlarını çalıştır
    async runMigrations() {
        try {
            // Blog posts tablosuna images kolonu ekle
            await this.addImagesColumnToBlogPosts();
            // Events tablosuna google_maps_link kolonu ekle
            await this.addGoogleMapsLinkColumnToEvents();
            // Media coverage tablosuna source kolonlarini ekle
            await this.addSourceColumnsToMediaCoverage();
            // Orders tablosuna odeme kolonlarini ekle
            await this.addPaymentColumnsToOrders();
            // Orders tablosuna fulfillment kolonlarini ekle
            await this.addFulfillmentColumnsToOrders();
            // Odeme deneme/event tablolarini olustur
            await this.ensurePaymentTables();
            // Fulfillment event tablosunu olustur
            await this.ensureFulfillmentTables();
            console.log('Veritabanı migrasyonları başarıyla çalıştırıldı');
        } catch (error) {
            console.error('Migrasyon hatası:', error);
            throw error;
        }
    }

    // Blog posts tablosuna images kolonu ekle
    async addImagesColumnToBlogPosts() {
        try {
            // Tablonun var olup olmadığını kontrol et
            const tableExists = await this.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='blog_posts'
            `);

            if (!tableExists) {
                return; // Tablo yoksa, migrasyon gerekmiyor
            }

            // Kolonun var olup olmadığını kontrol et
            const columnInfo = await this.all(`PRAGMA table_info(blog_posts)`);
            const hasImagesColumn = columnInfo.some(column => column.name === 'images');

            if (!hasImagesColumn) {
                // Images kolonunu ekle
                await this.run(`
                    ALTER TABLE blog_posts
                    ADD COLUMN images TEXT NOT NULL DEFAULT '[]'
                `);
                console.log('Blog posts tablosuna images kolonu eklendi');
            }
        } catch (error) {
            console.error('Images kolonu ekleme hatası:', error);
            throw error;
        }
    }

    // Events tablosuna google_maps_link kolonu ekle
    async addGoogleMapsLinkColumnToEvents() {
        try {
            // Tablonun var olup olmadığını kontrol et
            const tableExists = await this.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='events'
            `);

            if (!tableExists) {
                return; // Tablo yoksa, migrasyon gerekmiyor
            }

            // Kolonun var olup olmadığını kontrol et
            const columnInfo = await this.all(`PRAGMA table_info(events)`);
            const hasGoogleMapsLinkColumn = columnInfo.some(column => column.name === 'google_maps_link');

            if (!hasGoogleMapsLinkColumn) {
                // google_maps_link kolonunu ekle
                await this.run(`
                    ALTER TABLE events
                    ADD COLUMN google_maps_link TEXT
                `);
                console.log('Events tablosuna google_maps_link kolonu eklendi');
            }
        } catch (error) {
            console.error('google_maps_link kolonu ekleme hatası:', error);
            throw error;
        }
    }

    async addSourceColumnsToMediaCoverage() {
        try {
            const tableExists = await this.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='media_coverage'
            `);

            if (!tableExists) {
                return;
            }

            const columnInfo = await this.all('PRAGMA table_info(media_coverage)');
            const hasSourceNameColumn = columnInfo.some((column) => column.name === 'source_name');
            const hasSourceUrlColumn = columnInfo.some((column) => column.name === 'source_url');

            if (!hasSourceNameColumn) {
                await this.run(`
                    ALTER TABLE media_coverage
                    ADD COLUMN source_name TEXT NOT NULL DEFAULT ''
                `);
                console.log('Media coverage tablosuna source_name kolonu eklendi');
            }

            if (!hasSourceUrlColumn) {
                await this.run(`
                    ALTER TABLE media_coverage
                    ADD COLUMN source_url TEXT NOT NULL DEFAULT ''
                `);
                console.log('Media coverage tablosuna source_url kolonu eklendi');
            }
        } catch (error) {
            console.error('Media coverage source kolon migrasyonu hatası:', error);
            throw error;
        }
    }

    async addPaymentColumnsToOrders() {
        try {
            const tableExists = await this.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='orders'
            `);

            if (!tableExists) {
                return;
            }

            const columnInfo = await this.all('PRAGMA table_info(orders)');
            const hasColumn = (columnName) => columnInfo.some((column) => column.name === columnName);

            if (!hasColumn('payment_status')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
                `);
                console.log('Orders tablosuna payment_status kolonu eklendi');
            }

            if (!hasColumn('payment_provider')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_provider TEXT
                `);
                console.log('Orders tablosuna payment_provider kolonu eklendi');
            }

            if (!hasColumn('payment_reference')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_reference TEXT
                `);
                console.log('Orders tablosuna payment_reference kolonu eklendi');
            }

            if (!hasColumn('payment_amount')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_amount REAL NOT NULL DEFAULT 0
                `);
                console.log('Orders tablosuna payment_amount kolonu eklendi');
            }

            if (!hasColumn('payment_currency')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_currency TEXT NOT NULL DEFAULT 'USD'
                `);
                console.log('Orders tablosuna payment_currency kolonu eklendi');
            }

            if (!hasColumn('payment_failed_reason')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN payment_failed_reason TEXT
                `);
                console.log('Orders tablosuna payment_failed_reason kolonu eklendi');
            }

            if (!hasColumn('paid_at')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN paid_at TEXT
                `);
                console.log('Orders tablosuna paid_at kolonu eklendi');
            }

            await this.run(`
                UPDATE orders
                SET payment_amount = total_amount
                WHERE payment_amount IS NULL OR payment_amount <= 0
            `);

            await this.run(`
                UPDATE orders
                SET payment_status = 'paid'
                WHERE status IN ('preparing', 'shipping', 'delivered')
                  AND (payment_status IS NULL OR payment_status = 'pending')
            `);
        } catch (error) {
            console.error('Orders payment kolon migrasyonu hatası:', error);
            throw error;
        }
    }

    async addFulfillmentColumnsToOrders() {
        try {
            const tableExists = await this.get(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='orders'
            `);

            if (!tableExists) {
                return;
            }

            const columnInfo = await this.all('PRAGMA table_info(orders)');
            const hasColumn = (columnName) => columnInfo.some((column) => column.name === columnName);

            if (!hasColumn('shipment_provider')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN shipment_provider TEXT
                `);
                console.log('Orders tablosuna shipment_provider kolonu eklendi');
            }

            if (!hasColumn('shipment_tracking_number')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN shipment_tracking_number TEXT
                `);
                console.log('Orders tablosuna shipment_tracking_number kolonu eklendi');
            }

            if (!hasColumn('fulfillment_source')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN fulfillment_source TEXT NOT NULL DEFAULT 'manual'
                `);
                console.log('Orders tablosuna fulfillment_source kolonu eklendi');
            }

            if (!hasColumn('fulfillment_updated_at')) {
                await this.run(`
                    ALTER TABLE orders
                    ADD COLUMN fulfillment_updated_at TEXT
                `);
                console.log('Orders tablosuna fulfillment_updated_at kolonu eklendi');
            }

            await this.run(`
                UPDATE orders
                SET fulfillment_source = 'manual'
                WHERE fulfillment_source IS NULL OR TRIM(fulfillment_source) = ''
            `);

            await this.run(`
                UPDATE orders
                SET fulfillment_updated_at = created_at
                WHERE fulfillment_updated_at IS NULL OR TRIM(fulfillment_updated_at) = ''
            `);
        } catch (error) {
            console.error('Orders fulfillment kolon migrasyonu hatası:', error);
            throw error;
        }
    }

    async ensurePaymentTables() {
        try {
            await this.run(`
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
                )
            `);

            await this.run(`
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
                )
            `);

            await this.run('CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON payment_attempts(order_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id)');
        } catch (error) {
            console.error('Payment tablo migrasyonu hatası:', error);
            throw error;
        }
    }

    async ensureFulfillmentTables() {
        try {
            await this.run(`
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
                )
            `);

            await this.run('CREATE INDEX IF NOT EXISTS idx_fulfillment_events_order_id ON fulfillment_events(order_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_fulfillment_events_source ON fulfillment_events(source)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_fulfillment_events_provider_event ON fulfillment_events(shipment_provider, provider_event_id)');
        } catch (error) {
            console.error('Fulfillment tablo migrasyonu hatası:', error);
            throw error;
        }
    }

    // SQL sorgusu çalıştır (INSERT, UPDATE, DELETE)
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('SQL çalıştırma hatası:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Tek satır veri getir (SELECT)
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Veri getirme hatası:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Çoklu satır veri getir (SELECT)
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Veri getirme hatası:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async runInTransaction(work) {
        await this.run('BEGIN IMMEDIATE TRANSACTION');

        try {
            const result = await work();
            await this.run('COMMIT');
            return result;
        } catch (error) {
            try {
                await this.run('ROLLBACK');
            } catch (rollbackError) {
                console.error('Transaction rollback hatası:', rollbackError);
            }

            throw error;
        }
    }

    // === KULLANICI İŞLEMLERİ ===

    async getAllUsers() {
        const sql = 'SELECT id, email, name, is_admin as isAdmin, created_at as createdAt FROM users ORDER BY created_at DESC';
        return this.all(sql);
    }

    async getAllUsersWithPasswords() {
        const sql = 'SELECT id, email, name, password, is_admin as isAdmin, created_at as createdAt FROM users ORDER BY created_at DESC';
        return this.all(sql);
    }

    async getUserById(id) {
        const sql = 'SELECT id, email, name, password, is_admin as isAdmin, created_at as createdAt FROM users WHERE id = ?';
        return this.get(sql, [id]);
    }

    async getUserByEmail(email) {
        const sql = 'SELECT id, email, name, password, is_admin as isAdmin, created_at as createdAt FROM users WHERE email = ?';
        return this.get(sql, [email]);
    }

    async createUser(user) {
        const sql = 'INSERT INTO users (id, email, name, password, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        return this.run(sql, [user.id, user.email, user.name, user.password, user.isAdmin || 0, user.createdAt]);
    }

    async updateUserPassword(userId, newPassword) {
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        return this.run(sql, [newPassword, userId]);
    }

    async updateUser(userId, userData) {
        const { email, name, password, isAdmin, createdAt } = userData;
        const sql = 'UPDATE users SET email = ?, name = ?, password = ?, is_admin = ?, created_at = ? WHERE id = ?';
        return this.run(sql, [email, name, password, isAdmin || 0, createdAt, userId]);
    }

    async deleteUser(userId) {
        const sql = 'DELETE FROM users WHERE id = ?';
        return this.run(sql, [userId]);
    }

    // === SİPARİŞ İŞLEMLERİ ===

    _buildOrderQuery({ where, orderBy } = {}) {
        const whereClause = where ? `WHERE ${where}` : '';
        const orderByClause = orderBy || 'o.created_at DESC';
        return `
            SELECT o.id, o.user_id as userId, o.total_amount as totalAmount, o.status,
                   o.payment_status as paymentStatus, o.payment_provider as paymentProvider,
                   o.payment_reference as paymentReference, o.payment_amount as paymentAmount,
                   o.payment_currency as paymentCurrency, o.payment_failed_reason as paymentFailedReason,
                   o.paid_at as paidAt,
                   o.shipment_provider as shipmentProvider,
                   o.shipment_tracking_number as shipmentTrackingNumber,
                   o.fulfillment_source as fulfillmentSource,
                   o.fulfillment_updated_at as fulfillmentUpdatedAt,
                   o.customer_name as customerName, o.customer_email as customerEmail,
                   o.shipping_address as shippingAddress, o.created_at as createdAt,
                     json_group_array(
                         json_object('id', oi.product_id, 'name', oi.product_name, 'productId', oi.product_id, 'productName', oi.product_name,
                                     'quantity', oi.quantity, 'price', oi.price, 'image', oi.image)
                    ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereClause}
            GROUP BY o.id
            ORDER BY ${orderByClause}
        `;
    }

    async getAllOrders() {
        const sql = this._buildOrderQuery();
        const orders = await this.all(sql);
        return orders.map((order) => this.normalizeOrderRow(order));
    }

    async getOrdersByUserId(userId) {
        const sql = this._buildOrderQuery({ where: 'o.user_id = ?' });
        const orders = await this.all(sql, [userId]);
        return orders.map((order) => this.normalizeOrderRow(order));
    }

    async getOrderById(id) {
        const sql = this._buildOrderQuery({ where: 'o.id = ?' });
        const order = await this.get(sql, [id]);
        return this.normalizeOrderRow(order);
    }

    async createOrder(order) {
        const { items } = order;

        await this.runInTransaction(async () => {
            const sql = `
                INSERT INTO orders (
                    id, user_id, total_amount, status, customer_name, customer_email, shipping_address, created_at,
                    payment_status, payment_provider, payment_reference, payment_amount, payment_currency,
                    payment_failed_reason, paid_at,
                    shipment_provider, shipment_tracking_number, fulfillment_source, fulfillment_updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await this.run(sql, [
                order.id,
                order.userId,
                order.totalAmount,
                order.status,
                order.customerName,
                order.customerEmail,
                JSON.stringify(order.shippingAddress),
                order.createdAt,
                order.paymentStatus || 'pending',
                order.paymentProvider || null,
                order.paymentReference || null,
                Number.isFinite(Number(order.paymentAmount)) ? Number(order.paymentAmount) : Number(order.totalAmount),
                order.paymentCurrency || 'USD',
                order.paymentFailedReason || null,
                order.paidAt || null,
                order.shipmentProvider || null,
                order.shipmentTrackingNumber || null,
                order.fulfillmentSource || 'manual',
                order.fulfillmentUpdatedAt || order.createdAt,
            ]);

            for (const item of items) {
                const itemSql = `
                    INSERT INTO order_items (order_id, product_id, product_name, quantity, price, image)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                await this.run(itemSql, [
                    order.id,
                    item.id,
                    item.name,
                    item.quantity,
                    item.price,
                    item.image
                ]);
            }
        });

        return this.getOrderById(order.id);
    }

    async updateOrderStatus(orderId, status) {
        const resultOrder = await this.updateOrderFulfillment(orderId, { status });
        if (!resultOrder) {
            return null;
        }

        return resultOrder;
    }

    async updateOrderFulfillment(orderId, fulfillmentData) {
        const fields = ['status = ?', 'fulfillment_updated_at = ?'];
        const now = fulfillmentData.fulfillmentUpdatedAt || new Date().toISOString();
        const values = [fulfillmentData.status, now];

        if (fulfillmentData.shipmentProvider !== undefined) {
            fields.push('shipment_provider = ?');
            values.push(fulfillmentData.shipmentProvider || null);
        }

        if (fulfillmentData.shipmentTrackingNumber !== undefined) {
            fields.push('shipment_tracking_number = ?');
            values.push(fulfillmentData.shipmentTrackingNumber || null);
        }

        if (fulfillmentData.fulfillmentSource !== undefined) {
            fields.push('fulfillment_source = ?');
            values.push(fulfillmentData.fulfillmentSource || 'manual');
        }

        values.push(orderId);
        const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getOrderById(orderId);
    }

    async deleteOrder(orderId) {
        return this.runInTransaction(async () => {
            await this.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);
            const sql = 'DELETE FROM orders WHERE id = ?';
            return this.run(sql, [orderId]);
        });
    }

    async getPaymentAttemptById(id) {
        const sql = `
            SELECT id, order_id as orderId, provider, provider_reference as providerReference,
                   amount, currency, status, failure_reason as failureReason,
                   metadata, created_at as createdAt, updated_at as updatedAt
            FROM payment_attempts
            WHERE id = ?
        `;
        const attempt = await this.get(sql, [id]);

        if (!attempt) {
            return null;
        }

        return {
            ...attempt,
            metadata: attempt.metadata ? this.safeJsonParse(attempt.metadata, {}) : {},
        };
    }

    async getPaymentAttemptsByOrderId(orderId) {
        const sql = `
            SELECT id, order_id as orderId, provider, provider_reference as providerReference,
                   amount, currency, status, failure_reason as failureReason,
                   metadata, created_at as createdAt, updated_at as updatedAt
            FROM payment_attempts
            WHERE order_id = ?
            ORDER BY created_at DESC
        `;
        const attempts = await this.all(sql, [orderId]);

        return attempts.map((attempt) => ({
            ...attempt,
            metadata: attempt.metadata ? this.safeJsonParse(attempt.metadata, {}) : {},
        }));
    }

    async createPaymentAttempt(paymentAttempt) {
        const sql = `
            INSERT INTO payment_attempts (
                id, order_id, provider, provider_reference, amount, currency,
                status, failure_reason, metadata, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.run(sql, [
            paymentAttempt.id,
            paymentAttempt.orderId,
            paymentAttempt.provider,
            paymentAttempt.providerReference || null,
            Number(paymentAttempt.amount),
            paymentAttempt.currency || 'USD',
            paymentAttempt.status,
            paymentAttempt.failureReason || null,
            JSON.stringify(paymentAttempt.metadata || {}),
            paymentAttempt.createdAt,
            paymentAttempt.updatedAt,
        ]);

        return this.getPaymentAttemptById(paymentAttempt.id);
    }

    async updatePaymentAttemptStatus(paymentAttemptId, status, updates = {}) {
        const fields = ['status = ?', 'updated_at = ?'];
        const values = [status, updates.updatedAt || new Date().toISOString()];

        if (updates.providerReference !== undefined) {
            fields.push('provider_reference = ?');
            values.push(updates.providerReference || null);
        }

        if (updates.failureReason !== undefined) {
            fields.push('failure_reason = ?');
            values.push(updates.failureReason || null);
        }

        if (updates.metadata !== undefined) {
            fields.push('metadata = ?');
            values.push(JSON.stringify(updates.metadata || {}));
        }

        values.push(paymentAttemptId);
        const sql = `UPDATE payment_attempts SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getPaymentAttemptById(paymentAttemptId);
    }

    async getPaymentEventByProviderEvent(provider, providerEventId) {
        const sql = `
            SELECT id, provider, provider_event_id as providerEventId,
                   event_type as eventType, order_id as orderId,
                   payload, processed_at as processedAt
            FROM payment_events
            WHERE provider = ? AND provider_event_id = ?
        `;

        const event = await this.get(sql, [provider, providerEventId]);
        if (!event) {
            return null;
        }

        return {
            ...event,
            payload: event.payload ? this.safeJsonParse(event.payload, {}) : {},
        };
    }

    async savePaymentEvent(event) {
        const existingEvent = await this.getPaymentEventByProviderEvent(event.provider, event.providerEventId);
        if (existingEvent) {
            return {
                created: false,
                event: existingEvent,
            };
        }

        const sql = `
            INSERT INTO payment_events (
                id, provider, provider_event_id, event_type, order_id, payload, processed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await this.run(sql, [
            event.id,
            event.provider,
            event.providerEventId,
            event.eventType,
            event.orderId || null,
            JSON.stringify(event.payload || {}),
            event.processedAt,
        ]);

        return {
            created: true,
            event: await this.getPaymentEventByProviderEvent(event.provider, event.providerEventId),
        };
    }

    async getFulfillmentEventById(id) {
        const sql = `
            SELECT id, order_id as orderId, source, from_status as fromStatus, to_status as toStatus,
                   shipment_provider as shipmentProvider, shipment_tracking_number as shipmentTrackingNumber,
                   provider_event_id as providerEventId, reason, actor_user_id as actorUserId,
                   actor_email as actorEmail, payload, created_at as createdAt
            FROM fulfillment_events
            WHERE id = ?
        `;

        const event = await this.get(sql, [id]);
        if (!event) {
            return null;
        }

        return {
            ...event,
            payload: event.payload ? this.safeJsonParse(event.payload, {}) : {},
        };
    }

    async getFulfillmentEventByProviderEvent(provider, providerEventId) {
        const sql = `
            SELECT id, order_id as orderId, source, from_status as fromStatus, to_status as toStatus,
                   shipment_provider as shipmentProvider, shipment_tracking_number as shipmentTrackingNumber,
                   provider_event_id as providerEventId, reason, actor_user_id as actorUserId,
                   actor_email as actorEmail, payload, created_at as createdAt
            FROM fulfillment_events
            WHERE source = 'carrier-webhook'
              AND shipment_provider = ?
              AND provider_event_id = ?
            LIMIT 1
        `;

        const event = await this.get(sql, [provider, providerEventId]);
        if (!event) {
            return null;
        }

        return {
            ...event,
            payload: event.payload ? this.safeJsonParse(event.payload, {}) : {},
        };
    }

    async getFulfillmentEventsByOrderId(orderId) {
        const sql = `
            SELECT id, order_id as orderId, source, from_status as fromStatus, to_status as toStatus,
                   shipment_provider as shipmentProvider, shipment_tracking_number as shipmentTrackingNumber,
                   provider_event_id as providerEventId, reason, actor_user_id as actorUserId,
                   actor_email as actorEmail, payload, created_at as createdAt
            FROM fulfillment_events
            WHERE order_id = ?
            ORDER BY created_at DESC
        `;

        const events = await this.all(sql, [orderId]);
        return events.map((event) => ({
            ...event,
            payload: event.payload ? this.safeJsonParse(event.payload, {}) : {},
        }));
    }

    async createFulfillmentEvent(event) {
        const sql = `
            INSERT INTO fulfillment_events (
                id, order_id, source, from_status, to_status,
                shipment_provider, shipment_tracking_number, provider_event_id,
                reason, actor_user_id, actor_email, payload, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.run(sql, [
            event.id,
            event.orderId,
            event.source,
            event.fromStatus || null,
            event.toStatus,
            event.shipmentProvider || null,
            event.shipmentTrackingNumber || null,
            event.providerEventId || null,
            event.reason || null,
            event.actorUserId || null,
            event.actorEmail || null,
            JSON.stringify(event.payload || {}),
            event.createdAt,
        ]);

        return this.getFulfillmentEventById(event.id);
    }

    async updateOrderPayment(orderId, paymentData) {
        const fields = ['payment_status = ?'];
        const values = [paymentData.paymentStatus];

        if (paymentData.paymentProvider !== undefined) {
            fields.push('payment_provider = ?');
            values.push(paymentData.paymentProvider || null);
        }

        if (paymentData.paymentReference !== undefined) {
            fields.push('payment_reference = ?');
            values.push(paymentData.paymentReference || null);
        }

        if (paymentData.paymentAmount !== undefined) {
            fields.push('payment_amount = ?');
            values.push(Number(paymentData.paymentAmount));
        }

        if (paymentData.paymentCurrency !== undefined) {
            fields.push('payment_currency = ?');
            values.push(paymentData.paymentCurrency || 'USD');
        }

        if (paymentData.paymentFailedReason !== undefined) {
            fields.push('payment_failed_reason = ?');
            values.push(paymentData.paymentFailedReason || null);
        }

        if (paymentData.paidAt !== undefined) {
            fields.push('paid_at = ?');
            values.push(paymentData.paidAt || null);
        }

        values.push(orderId);
        const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getOrderById(orderId);
    }

    // === KURS KAYIT İŞLEMLERİ ===

    async getAllRegistrations() {
        const sql = `
            SELECT id, user_id as userId, course_name as courseName, registration_data as registrationData,
                   status, customer_name as customerName, customer_email as customerEmail,
                   customer_phone as customerPhone, shipping_address as shippingAddress,
                   shipping_city as shippingCity, shipping_state as shippingState, shipping_zip_code as shippingZipCode,
                   billing_address as billingAddress, billing_city as billingCity, billing_state as billingState,
                   billing_zip_code as billingZipCode, created_at as createdAt
            FROM course_registrations
            ORDER BY created_at DESC
        `;
        const registrations = await this.all(sql);
        return registrations.map(registration => ({
            ...registration,
            registrationData: registration.registrationData ? this.safeJsonParse(registration.registrationData, {}) : {}
        }));
    }

    async getRegistrationsByUserId(userId) {
        const sql = `
            SELECT id, user_id as userId, course_name as courseName, registration_data as registrationData,
                   status, customer_name as customerName, customer_email as customerEmail,
                   customer_phone as customerPhone, shipping_address as shippingAddress,
                   shipping_city as shippingCity, shipping_state as shippingState, shipping_zip_code as shippingZipCode,
                   billing_address as billingAddress, billing_city as billingCity, billing_state as billingState,
                   billing_zip_code as billingZipCode, created_at as createdAt
            FROM course_registrations
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const registrations = await this.all(sql, [userId]);
        return registrations.map(registration => ({
            ...registration,
            registrationData: registration.registrationData ? this.safeJsonParse(registration.registrationData, {}) : {}
        }));
    }

    async getRegistrationById(id) {
        const sql = `
            SELECT id, user_id as userId, course_name as courseName, registration_data as registrationData,
                   status, customer_name as customerName, customer_email as customerEmail,
                   customer_phone as customerPhone, shipping_address as shippingAddress,
                   shipping_city as shippingCity, shipping_state as shippingState, shipping_zip_code as shippingZipCode,
                   billing_address as billingAddress, billing_city as billingCity, billing_state as billingState,
                   billing_zip_code as billingZipCode, created_at as createdAt
            FROM course_registrations
            WHERE id = ?
        `;
        const registration = await this.get(sql, [id]);
        if (registration && registration.registrationData) {
            registration.registrationData = this.safeJsonParse(registration.registrationData, {});
        }
        return registration;
    }

    async createRegistration(registration) {
        const sql = `
            INSERT INTO course_registrations (
                id, user_id, course_name, registration_data, status, customer_name, customer_email, 
                customer_phone, shipping_address, shipping_city, shipping_state, shipping_zip_code,
                billing_address, billing_city, billing_state, billing_zip_code, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.run(sql, [
            registration.id,
            registration.userId,
            registration.courseName,
            JSON.stringify(registration.registrationData),
            registration.status,
            registration.customerName,
            registration.customerEmail,
            registration.customerPhone,
            registration.shippingAddress,
            registration.shippingCity,
            registration.shippingState,
            registration.shippingZipCode,
            registration.billingAddress,
            registration.billingCity,
            registration.billingState,
            registration.billingZipCode,
            registration.createdAt
        ]);

        return this.getRegistrationById(registration.id);
    }

    async updateRegistrationStatus(registrationId, status) {
        const sql = 'UPDATE course_registrations SET status = ? WHERE id = ?';
        const result = await this.run(sql, [status, registrationId]);
        if (result.changes === 0) {
            return null;
        }

        return this.getRegistrationById(registrationId);
    }

    async deleteRegistration(registrationId) {
        const sql = 'DELETE FROM course_registrations WHERE id = ?';
        return this.run(sql, [registrationId]);
    }

    // === İLETİŞİM İŞLEMLERİ ===

    async getAllContacts() {
        const sql = `
            SELECT id, type, name, email, subject, message, status, created_at as createdAt
            FROM contacts
            ORDER BY created_at DESC
        `;
        return this.all(sql);
    }

    async getContactById(id) {
        const sql = `
            SELECT id, type, name, email, subject, message, status, created_at as createdAt
            FROM contacts
            WHERE id = ?
        `;
        return this.get(sql, [id]);
    }

    async createContact(contact) {
        const sql = `
            INSERT INTO contacts (id, type, name, email, subject, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.run(sql, [
            contact.id,
            contact.type,
            contact.name,
            contact.email,
            contact.subject,
            contact.message,
            contact.status,
            contact.createdAt
        ]);

        return this.getContactById(contact.id);
    }

    async updateContactStatus(contactId, status) {
        const sql = 'UPDATE contacts SET status = ? WHERE id = ?';
        const result = await this.run(sql, [status, contactId]);
        if (result.changes === 0) {
            return null;
        }

        return this.getContactById(contactId);
    }

    async deleteContact(contactId) {
        const sql = 'DELETE FROM contacts WHERE id = ?';
        return this.run(sql, [contactId]);
    }

    // === BLOG İŞLEMLERİ ===

    async getAllBlogPosts() {
        const sql = `
            SELECT id, title, content, excerpt, author, publish_date as publishDate,
                   status, images, created_at as createdAt, updated_at as updatedAt
            FROM blog_posts
            ORDER BY created_at DESC
        `;
        const posts = await this.all(sql);
        return posts.map(post => ({
            ...post,
            images: post.images ? this.safeJsonParse(post.images, []) : []
        }));
    }

    async getBlogPostById(id) {
        const sql = `
            SELECT id, title, content, excerpt, author, publish_date as publishDate,
                   status, images, created_at as createdAt, updated_at as updatedAt
            FROM blog_posts
            WHERE id = ?
        `;
        const post = await this.get(sql, [id]);
        if (post && post.images) {
            post.images = this.safeJsonParse(post.images, []);
        }
        return post;
    }

    async createBlogPost(blogPost) {
        const sql = `
            INSERT INTO blog_posts (id, title, content, excerpt, author, publish_date, status, images, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.run(sql, [
            blogPost.id,
            blogPost.title,
            blogPost.content,
            blogPost.excerpt,
            blogPost.author,
            blogPost.publishDate,
            blogPost.status,
            JSON.stringify(blogPost.images || []),
            blogPost.createdAt,
            blogPost.updatedAt
        ]);

        return this.getBlogPostById(blogPost.id);
    }

    async updateBlogPost(id, blogPost) {
        const fields = [];
        const values = [];

        if (blogPost.title !== undefined) {
            fields.push('title = ?');
            values.push(blogPost.title);
        }
        if (blogPost.content !== undefined) {
            fields.push('content = ?');
            values.push(blogPost.content);
        }
        if (blogPost.excerpt !== undefined) {
            fields.push('excerpt = ?');
            values.push(blogPost.excerpt);
        }
        if (blogPost.author !== undefined) {
            fields.push('author = ?');
            values.push(blogPost.author);
        }
        if (blogPost.publishDate !== undefined) {
            fields.push('publish_date = ?');
            values.push(blogPost.publishDate);
        }
        if (blogPost.status !== undefined) {
            fields.push('status = ?');
            values.push(blogPost.status);
        }
        if (blogPost.images !== undefined) {
            fields.push('images = ?');
            values.push(JSON.stringify(blogPost.images || []));
        }

        fields.push('updated_at = ?');
        values.push(blogPost.updatedAt || new Date().toISOString());

        values.push(id);
        const sql = `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getBlogPostById(id);
    }

    async updateBlogPostStatus(id, status) {
        return this.updateBlogPost(id, {
            status,
            updatedAt: new Date().toISOString(),
        });
    }

    async deleteBlogPost(id) {
        const sql = 'DELETE FROM blog_posts WHERE id = ?';
        return this.run(sql, [id]);
    }

    // === PRESS RELEASES İŞLEMLERİ ===

    async getAllPressReleases() {
        const sql = `
        SELECT id, title, content, excerpt, author, publish_date as publishDate,
               status, images, created_at as createdAt, updated_at as updatedAt
        FROM press_releases
        ORDER BY created_at DESC
    `;
        const releases = await this.all(sql);
        return releases.map(release => ({
            ...release,
            images: release.images ? this.safeJsonParse(release.images, []) : []
        }));
    }

    async getPressReleaseById(id) {
        const sql = `
        SELECT id, title, content, excerpt, author, publish_date as publishDate,
               status, images, created_at as createdAt, updated_at as updatedAt
        FROM press_releases
        WHERE id = ?
    `;
        const release = await this.get(sql, [id]);
        if (release && release.images) {
            release.images = this.safeJsonParse(release.images, []);
        }
        return release;
    }

    async createPressRelease(pressRelease) {
        const sql = `
        INSERT INTO press_releases (id, title, content, excerpt, author, publish_date, status, images, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.run(sql, [
            pressRelease.id,
            pressRelease.title,
            pressRelease.content,
            pressRelease.excerpt,
            pressRelease.author,
            pressRelease.publishDate,
            pressRelease.status,
            JSON.stringify(pressRelease.images || []),
            pressRelease.createdAt,
            pressRelease.updatedAt
        ]);

        return this.getPressReleaseById(pressRelease.id);
    }

    async updatePressRelease(id, pressRelease) {
        const fields = [];
        const values = [];

        if (pressRelease.title !== undefined) {
            fields.push('title = ?');
            values.push(pressRelease.title);
        }
        if (pressRelease.content !== undefined) {
            fields.push('content = ?');
            values.push(pressRelease.content);
        }
        if (pressRelease.excerpt !== undefined) {
            fields.push('excerpt = ?');
            values.push(pressRelease.excerpt);
        }
        if (pressRelease.author !== undefined) {
            fields.push('author = ?');
            values.push(pressRelease.author);
        }
        if (pressRelease.publishDate !== undefined) {
            fields.push('publish_date = ?');
            values.push(pressRelease.publishDate);
        }
        if (pressRelease.status !== undefined) {
            fields.push('status = ?');
            values.push(pressRelease.status);
        }
        if (pressRelease.images !== undefined) {
            fields.push('images = ?');
            values.push(JSON.stringify(pressRelease.images || []));
        }

        fields.push('updated_at = ?');
        values.push(pressRelease.updatedAt || new Date().toISOString());

        values.push(id);
        const sql = `UPDATE press_releases SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getPressReleaseById(id);
    }

    async updatePressReleaseStatus(id, status) {
        return this.updatePressRelease(id, {
            status,
            updatedAt: new Date().toISOString(),
        });
    }

    async deletePressRelease(id) {
        const sql = 'DELETE FROM press_releases WHERE id = ?';
        return this.run(sql, [id]);
    }

    // === MEDIA COVERAGE İŞLEMLERİ ===

    async getAllMediaCoverages() {
        const sql = `
        SELECT id, title, content, excerpt, source_name as sourceName, source_url as sourceUrl, author, publish_date as publishDate,
               status, images, created_at as createdAt, updated_at as updatedAt
        FROM media_coverage
        ORDER BY created_at DESC
    `;
        const coverages = await this.all(sql);
        return coverages.map(coverage => ({
            ...coverage,
            images: coverage.images ? this.safeJsonParse(coverage.images, []) : []
        }));
    }

    async getMediaCoverageById(id) {
        const sql = `
        SELECT id, title, content, excerpt, source_name as sourceName, source_url as sourceUrl, author, publish_date as publishDate,
               status, images, created_at as createdAt, updated_at as updatedAt
        FROM media_coverage
        WHERE id = ?
    `;
        const coverage = await this.get(sql, [id]);
        if (coverage && coverage.images) {
            coverage.images = this.safeJsonParse(coverage.images, []);
        }
        return coverage;
    }

    async createMediaCoverage(mediaCoverage) {
        const sourceName = mediaCoverage.sourceName || '';
        const sourceUrl = mediaCoverage.sourceUrl || '';
        const sql = `
        INSERT INTO media_coverage (id, title, content, excerpt, source_name, source_url, author, publish_date, status, images, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.run(sql, [
            mediaCoverage.id,
            mediaCoverage.title,
            mediaCoverage.content,
            mediaCoverage.excerpt,
            sourceName,
            sourceUrl,
            mediaCoverage.author,
            mediaCoverage.publishDate,
            mediaCoverage.status,
            JSON.stringify(mediaCoverage.images || []),
            mediaCoverage.createdAt,
            mediaCoverage.updatedAt
        ]);

        return this.getMediaCoverageById(mediaCoverage.id);
    }

    async updateMediaCoverage(id, mediaCoverage) {
        const fields = [];
        const values = [];

        if (mediaCoverage.title !== undefined) {
            fields.push('title = ?');
            values.push(mediaCoverage.title);
        }
        if (mediaCoverage.content !== undefined) {
            fields.push('content = ?');
            values.push(mediaCoverage.content);
        }
        if (mediaCoverage.excerpt !== undefined) {
            fields.push('excerpt = ?');
            values.push(mediaCoverage.excerpt);
        }
        if (mediaCoverage.sourceName !== undefined) {
            fields.push('source_name = ?');
            values.push(mediaCoverage.sourceName || '');
        }
        if (mediaCoverage.sourceUrl !== undefined) {
            fields.push('source_url = ?');
            values.push(mediaCoverage.sourceUrl || '');
        }
        if (mediaCoverage.author !== undefined) {
            fields.push('author = ?');
            values.push(mediaCoverage.author);
        }
        if (mediaCoverage.publishDate !== undefined) {
            fields.push('publish_date = ?');
            values.push(mediaCoverage.publishDate);
        }
        if (mediaCoverage.status !== undefined) {
            fields.push('status = ?');
            values.push(mediaCoverage.status);
        }
        if (mediaCoverage.images !== undefined) {
            fields.push('images = ?');
            values.push(JSON.stringify(mediaCoverage.images || []));
        }

        fields.push('updated_at = ?');
        values.push(mediaCoverage.updatedAt || new Date().toISOString());

        values.push(id);
        const sql = `UPDATE media_coverage SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getMediaCoverageById(id);
    }

    async updateMediaCoverageStatus(id, status) {
        return this.updateMediaCoverage(id, {
            status,
            updatedAt: new Date().toISOString(),
        });
    }

    async deleteMediaCoverage(id) {
        const sql = 'DELETE FROM media_coverage WHERE id = ?';
        return this.run(sql, [id]);
    }

    // === EVENTS İŞLEMLERİ ===

    async getAllEvents() {
        const sql = `
        SELECT id, title, description, excerpt, start_date as startDate, end_date as endDate,
               venue_name as venueName, venue_address as venueAddress, venue_city as venueCity,
               venue_state as venueState, venue_zip_code as venueZipCode, venue_country as venueCountry,
               venue_website as venueWebsite, google_maps_link as googleMapsLink, organizer_name as organizerName,
               organizer_website as organizerWebsite, event_website as eventWebsite,
               status, category, image_url as imageUrl, created_at as createdAt, updated_at as updatedAt
        FROM events
        ORDER BY start_date DESC
    `;
        return this.all(sql);
    }

    async getEventById(id) {
        const sql = `
            SELECT id, title, description, excerpt, start_date as startDate, end_date as endDate,
                   venue_name as venueName, venue_address as venueAddress, venue_city as venueCity,
                   venue_state as venueState, venue_zip_code as venueZipCode, venue_country as venueCountry,
                   venue_website as venueWebsite, google_maps_link as googleMapsLink, organizer_name as organizerName,
                   organizer_website as organizerWebsite, event_website as eventWebsite,
                   status, category, image_url as imageUrl, created_at as createdAt, updated_at as updatedAt
            FROM events
            WHERE id = ?
        `;
        return this.get(sql, [id]);
    }

    async createEvent(event) {
        const sql = `
            INSERT INTO events (
                id, title, description, excerpt, start_date, end_date, venue_name, venue_address,
                venue_city, venue_state, venue_zip_code, venue_country, venue_website, google_maps_link,
                organizer_name, organizer_website, event_website, status, category, image_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.run(sql, [
            event.id,
            event.title,
            event.description,
            event.excerpt,
            event.startDate,
            event.endDate,
            event.venueName,
            event.venueAddress,
            event.venueCity,
            event.venueState,
            event.venueZipCode,
            event.venueCountry,
            event.venueWebsite,
            event.googleMapsLink,
            event.organizerName,
            event.organizerWebsite,
            event.eventWebsite,
            event.status,
            event.category,
            event.imageUrl,
            event.createdAt,
            event.updatedAt
        ]);

        return this.getEventById(event.id);
    }

    async updateEvent(id, event) {
        const fields = [];
        const values = [];

        if (event.title !== undefined) {
            fields.push('title = ?');
            values.push(event.title);
        }
        if (event.description !== undefined) {
            fields.push('description = ?');
            values.push(event.description);
        }
        if (event.excerpt !== undefined) {
            fields.push('excerpt = ?');
            values.push(event.excerpt);
        }
        if (event.startDate !== undefined) {
            fields.push('start_date = ?');
            values.push(event.startDate);
        }
        if (event.endDate !== undefined) {
            fields.push('end_date = ?');
            values.push(event.endDate);
        }
        if (event.venueName !== undefined) {
            fields.push('venue_name = ?');
            values.push(event.venueName);
        }
        if (event.venueAddress !== undefined) {
            fields.push('venue_address = ?');
            values.push(event.venueAddress);
        }
        if (event.venueCity !== undefined) {
            fields.push('venue_city = ?');
            values.push(event.venueCity);
        }
        if (event.venueState !== undefined) {
            fields.push('venue_state = ?');
            values.push(event.venueState);
        }
        if (event.venueZipCode !== undefined) {
            fields.push('venue_zip_code = ?');
            values.push(event.venueZipCode);
        }
        if (event.venueCountry !== undefined) {
            fields.push('venue_country = ?');
            values.push(event.venueCountry);
        }
        if (event.venueWebsite !== undefined) {
            fields.push('venue_website = ?');
            values.push(event.venueWebsite);
        }
        if (event.googleMapsLink !== undefined) {
            fields.push('google_maps_link = ?');
            values.push(event.googleMapsLink);
        }
        if (event.organizerName !== undefined) {
            fields.push('organizer_name = ?');
            values.push(event.organizerName);
        }
        if (event.organizerWebsite !== undefined) {
            fields.push('organizer_website = ?');
            values.push(event.organizerWebsite);
        }
        if (event.eventWebsite !== undefined) {
            fields.push('event_website = ?');
            values.push(event.eventWebsite);
        }
        if (event.status !== undefined) {
            fields.push('status = ?');
            values.push(event.status);
        }
        if (event.category !== undefined) {
            fields.push('category = ?');
            values.push(event.category);
        }
        if (event.imageUrl !== undefined) {
            fields.push('image_url = ?');
            values.push(event.imageUrl);
        }

        fields.push('updated_at = ?');
        values.push(event.updatedAt || new Date().toISOString());

        values.push(id);
        const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
        const result = await this.run(sql, values);
        if (result.changes === 0) {
            return null;
        }

        return this.getEventById(id);
    }

    async updateEventStatus(id, status) {
        return this.updateEvent(id, {
            status,
            updatedAt: new Date().toISOString(),
        });
    }

    async deleteEvent(id) {
        const sql = 'DELETE FROM events WHERE id = ?';
        return this.run(sql, [id]);
    }

    // Veritabanı dosya yolunu getir
    getDatabasePath() {
        return DB_PATH;
    }

    // === KULLANICI ADRESLERİ ===

    async getUserAddresses(userId) {
        const sql = 'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC';
        return this.all(sql, [userId]);
    }

    async getUserAddressById(id) {
        const sql = 'SELECT * FROM user_addresses WHERE id = ?';
        return this.get(sql, [id]);
    }

    async createUserAddress(address) {
        return this.runInTransaction(async () => {
            if (address.isDefault) {
                await this.run('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [address.userId]);
            }

            const sql = `
                INSERT INTO user_addresses (
                    id, user_id, title, type, is_default, address, apartment, 
                    district, city, postal_code, province, country, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            return this.run(sql, [
                address.id,
                address.userId,
                address.title,
                address.type,
                address.isDefault,
                address.address,
                address.apartment,
                address.district,
                address.city,
                address.postalCode,
                address.province,
                address.country,
                address.createdAt,
                address.updatedAt
            ]);
        });
    }

    async updateUserAddress(id, address) {
        return this.runInTransaction(async () => {
            if (address.isDefault) {
                const existingAddress = await this.get('SELECT user_id FROM user_addresses WHERE id = ?', [id]);
                if (existingAddress) {
                    await this.run('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [existingAddress.user_id]);
                }
            }

            const sql = `
                UPDATE user_addresses SET 
                    title = ?, type = ?, is_default = ?, address = ?, apartment = ?, 
                    district = ?, city = ?, postal_code = ?, province = ?, country = ?, updated_at = ?
                WHERE id = ?
            `;
            return this.run(sql, [
                address.title,
                address.type,
                address.isDefault,
                address.address,
                address.apartment,
                address.district,
                address.city,
                address.postalCode,
                address.province,
                address.country,
                address.updatedAt,
                id
            ]);
        });
    }

    async deleteUserAddress(id) {
        const sql = 'DELETE FROM user_addresses WHERE id = ?';
        return this.run(sql, [id]);
    }

    // === KULLANICI ÖDEME YÖNTEMLERİ ===

    async getUserPaymentMethods(userId) {
        const sql = 'SELECT * FROM user_payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC';
        return this.all(sql, [userId]);
    }

    async getUserPaymentMethodById(id) {
        const sql = 'SELECT * FROM user_payment_methods WHERE id = ?';
        return this.get(sql, [id]);
    }

    async createUserPaymentMethod(paymentMethod) {
        return this.runInTransaction(async () => {
            if (paymentMethod.isDefault) {
                await this.run('UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?', [paymentMethod.userId]);
            }

            const sql = `
                INSERT INTO user_payment_methods (
                    id, user_id, card_title, card_last_four, card_type, 
                    expiry_month, expiry_year, holder_name, is_default, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            return this.run(sql, [
                paymentMethod.id,
                paymentMethod.userId,
                paymentMethod.cardTitle,
                paymentMethod.cardLastFour,
                paymentMethod.cardType,
                paymentMethod.expiryMonth,
                paymentMethod.expiryYear,
                paymentMethod.holderName,
                paymentMethod.isDefault,
                paymentMethod.createdAt,
                paymentMethod.updatedAt
            ]);
        });
    }

    async updateUserPaymentMethod(id, paymentMethod) {
        return this.runInTransaction(async () => {
            if (paymentMethod.isDefault) {
                const existingPaymentMethod = await this.get('SELECT user_id FROM user_payment_methods WHERE id = ?', [id]);
                if (existingPaymentMethod) {
                    await this.run('UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?', [existingPaymentMethod.user_id]);
                }
            }

            const fields = [];
            const values = [];

            if (paymentMethod.cardTitle !== undefined) {
                fields.push('card_title = ?');
                values.push(paymentMethod.cardTitle);
            }
            if (paymentMethod.cardLastFour !== undefined) {
                fields.push('card_last_four = ?');
                values.push(paymentMethod.cardLastFour);
            }
            if (paymentMethod.cardType !== undefined) {
                fields.push('card_type = ?');
                values.push(paymentMethod.cardType);
            }
            if (paymentMethod.expiryMonth !== undefined) {
                fields.push('expiry_month = ?');
                values.push(paymentMethod.expiryMonth);
            }
            if (paymentMethod.expiryYear !== undefined) {
                fields.push('expiry_year = ?');
                values.push(paymentMethod.expiryYear);
            }
            if (paymentMethod.holderName !== undefined) {
                fields.push('holder_name = ?');
                values.push(paymentMethod.holderName);
            }
            if (paymentMethod.isDefault !== undefined) {
                fields.push('is_default = ?');
                values.push(paymentMethod.isDefault);
            }
            if (paymentMethod.updatedAt !== undefined) {
                fields.push('updated_at = ?');
                values.push(paymentMethod.updatedAt);
            }

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);
            const sql = `UPDATE user_payment_methods SET ${fields.join(', ')} WHERE id = ?`;
            return this.run(sql, values);
        });
    }

    async deleteUserPaymentMethod(id) {
        const sql = 'DELETE FROM user_payment_methods WHERE id = ?';
        return this.run(sql, [id]);
    }

    // === DEMO VERİ İŞLEMLERİ ===

    async clearAllData() {
        await this.runInTransaction(async () => {
            await this.run('DELETE FROM order_items');
            await this.run('DELETE FROM payment_attempts');
            await this.run('DELETE FROM payment_events');
            await this.run('DELETE FROM fulfillment_events');
            await this.run('DELETE FROM orders');
            await this.run('DELETE FROM course_registrations');
            await this.run('DELETE FROM contacts');
            await this.run('DELETE FROM blog_posts');
            await this.run('DELETE FROM press_releases');
            await this.run('DELETE FROM media_coverage');
            await this.run('DELETE FROM events');
            await this.run('DELETE FROM user_addresses');
            await this.run('DELETE FROM user_payment_methods');
            await this.run('DELETE FROM users');
        });
    }
}

// Singleton instance
module.exports = new Database();
