const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    sold: Boolean,
    dateOfSale: Date,
});

module.exports = mongoose.model('Product', productSchema);
