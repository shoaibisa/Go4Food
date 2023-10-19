const mongoose = require('mongoose')

const productSchema = mongoose.Schema
({
    image: 
    {
        type: String,
        require: true,
    },
    category: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: 
    {
        type: String,
        required: true, 
    },
    description:
    {
        type: String,
        require: true,
    },
    price:
    {
        type: Number,
        default: 0,
    },
    rating:
    {
        type: Number,
        default: 0
    },
    numberReviews:
    {
        type: Number,
        default: 0,
    },
    isFeatured:
    {
        type: Boolean,
        default: false,
    }
})

exports.Product = mongoose.model('Product', productSchema);