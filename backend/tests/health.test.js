const request = require('supertest');
const server = require('../src/index');
const mongoose = require('mongoose');

describe('Health Check', () => {
    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    it('should return 200 OK', async () => {
        const res = await request(server).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Server is running');
    });
});
