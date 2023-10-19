const mongoose = require('mongoose');

const categorySchema = mongoose
({
    name:
    {
        type: String,
        required: true,
    }
})

exports.Category = mongoose.model('Category', categorySchema);