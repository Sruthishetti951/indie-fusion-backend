const { default: mongoose } = require("mongoose");

const PostModel = mongoose.model('post', {
    mediaUrl: {
        type: String
    },
    text: {
        type: String
    },
    postType: {
        type: String,
    },
    createdDate: {
        type: Date,
        default: Date.now()
    },
    updatedDate: {
        type: Date,
        default: Date.now()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }
    
}
)

module.exports=PostModel