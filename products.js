const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const axios = require('axios');

// Initialize database with data from third-party API
router.get('/initialize', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const products = response.data;

        await Product.deleteMany(); // Clear existing data
        await Product.insertMany(products); // Insert new data

        res.json({ message: 'Database initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initialize database' });
    }
});

// Get all transactions with search and pagination
router.get('/transactions', async (req, res) => {
    const { search = '', page = 1, perPage = 10 } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { price: { $regex: search } },
        ];
    }

    try {
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.json({ total, page, perPage, products });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
});

// Get statistics for a specific month
router.get('/statistics', async (req, res) => {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Month is required' });

    const monthIndex = new Date(Date.parse(month + " 1, 2020")).getMonth();

    try {
        const productsInMonth = await Product.find({
            dateOfSale: {
                $gte: new Date(2020, monthIndex, 1),
                $lt: new Date(2020, monthIndex + 1, 1)
            }
        });

        const totalSaleAmount = productsInMonth.reduce((sum, product) => product.sold ? sum + product.price : sum, 0);
        const soldItemsCount = productsInMonth.filter(product => product.sold).length;
        const notSoldItemsCount = productsInMonth.filter(product => !product.sold).length;

        res.json({ totalSaleAmount, soldItemsCount, notSoldItemsCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
});

module.exports = router;
