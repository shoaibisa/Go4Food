const mongoose = require('mongoose');

const User= new mongoose.model
(
    'Users',
    new mongoose.Schema
    ({
        email: String,
        password: String,
        name: String,
        role:
        [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'role',
            }
        ]
    })
);

const user = moongoose.model('User', UserSchema);