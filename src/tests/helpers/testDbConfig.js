// Generated by Copilot
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const testLogger = require('./testLogger');

class TestDatabase {
    constructor() {
        this.mongoServer = null;
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                return this.connection;
            }

            this.mongoServer = await MongoMemoryServer.create({
                instance: {
                    dbName: 'atcms_test',
                    port: 27017
                },
                binary: {
                    version: '7.0.3'  // Explicitly set MongoDB version
                }
            });

            const mongoUri = this.mongoServer.getUri();
            process.env.MONGO_URI = mongoUri; // Override the connection URL for tests

            this.connection = await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            this.isConnected = true;
            testLogger.info('Connected to test database:', mongoUri);

            return this.connection;
        } catch (error) {
            testLogger.error('Test database connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            if (this.mongoServer) {
                await this.mongoServer.stop();
            }
            this.isConnected = false;
            testLogger.info('Disconnected from test database');
        } catch (error) {
            testLogger.error('Test database disconnection error:', error);
            throw error;
        }
    }

    async clearCollections() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const collections = mongoose.connection.collections;
            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany({});
            }
            testLogger.info('Cleared all test collections');
        } catch (error) {
            testLogger.error('Error clearing test collections:', error);
            throw error;
        }
    }

    async dropDatabase() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            await mongoose.connection.dropDatabase();
            testLogger.info('Dropped test database');
        } catch (error) {
            testLogger.error('Error dropping test database:', error);
            throw error;
        }
    }

    getUri() {
        return this.mongoServer ? this.mongoServer.getUri() : null;
    }

    isInitialized() {
        return this.isConnected;
    }
}

module.exports = new TestDatabase();